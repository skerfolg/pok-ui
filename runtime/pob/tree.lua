-- Original PassiveSpec owns all pathing, dependency and allocation decisions.
return function(editor,states)
  local function array()return setmetatable({},{__jsontype='array'})end
  local state,differences=states.read,states.differences
  return function(request,current)
    if not current then editor.ensure(request.xml)end
    local spec=build.spec;spec.allocMode=request.allocMode or 0;spec:BuildAllDependsAndPaths()
    local before,old=state(spec),{}
    for id in pairs(spec.allocNodes)do old[id]=true end
    local result={patch={attributes={}},path=array(),added=array(),removed=array(),modified=array(),diagnostics=array(),treeVersion=spec.treeVersion}
    build:UpdateClassDropdowns(spec.treeVersion)
    local classes=array()
    for _,entry in ipairs(build.controls.classDrop.list)do
      local ascendancies=array();for _,asc in ipairs(entry.ascendancies)do ascendancies[#ascendancies+1]={id=asc.ascendClassId,label=StripEscapes(asc.label)}end
      classes[#classes+1]={id=entry.classId,label=StripEscapes(entry.label),ascendancies=ascendancies}
    end
    local decision
    if request.action=='character' and request.classId~=nil then
      local index,entry
      for i,value in ipairs(build.controls.classDrop.list)do if value.classId==request.classId then index=i;entry=value end end
      assert(entry,'Unknown original character class')
      local previous=main.OpenConfirmPopup
      main.OpenConfirmPopup=function(self,title,message,primary,confirm,secondary,alternative)
        decision={title=title,message=message,resetLabel=primary,connectLabel=secondary}
        if request.classChoice=='reset'then confirm();decision=nil
        elseif request.classChoice=='connect'then alternative();decision=nil end
      end
      local ok,message=pcall(build.controls.classDrop.selFunc,index,entry)
      main.OpenConfirmPopup=previous;assert(ok,message)
      if not decision and request.ascendancyId~=nil then
        assert(spec.curClassId==request.classId,'Original PoB could not connect to the requested class')
        local selected
        for _,asc in ipairs(entry.ascendancies)do if asc.ascendClassId==request.ascendancyId then selected=asc end end
        assert(selected,'Unknown original ascendancy for the selected class')
        build.controls.ascendDrop.selFunc(1,selected)
      end
    end
    result.character={classId=spec.curClassId,ascendancyId=spec.curAscendClassId,classes=classes,decision=decision}
    local node=request.nodeId and spec.nodes[request.nodeId]
    if request.nodeId then
      assert(node,'Node is not available in this original PoB tree')
      local options=array()
      for i,option in ipairs(node.options or {})do options[#options+1]={index=i,label=StripEscapes(option.dn or option.name or tostring(i))}end
      local stats=array();for _,line in ipairs(node.sd or {})do stats[#stats+1]=StripEscapes(line)end
      result.node={id=node.id,name=StripEscapes(node.dn or ''),stats=stats,allocated=not not node.alloc,mode=node.allocMode or 0,isAttribute=not not node.isAttribute,attributeOptions=options}
      local slot=build.itemsTab.sockets[node.id]
      if slot then
        slot:Populate();local choices=array()
        for _,id in ipairs(slot.items)do local item=build.itemsTab.items[id];choices[#choices+1]={id=id,label=item and StripEscapes(item.name) or 'None'}end
        result.node.socket={itemId=slot.selItemId,choices=choices}
      end
      if node.type=='ClassStart' or node.type=='AscendClassStart'then
        result.diagnostics[#result.diagnostics+1]={code='tree-root',message='Use original character/ascendancy selection for start nodes.'}
      elseif request.action=='attribute'then
        assert(node.alloc and node.isAttribute,'An allocated original attribute node is required')
        if not request.attributeIndex then result.diagnostics[#result.diagnostics+1]={code='tree-attribute-required',message='Choose an original attribute option.'}
        else assert(node.options[request.attributeIndex],'Unknown original attribute option');spec:SwitchAttributeNode(node.id,request.attributeIndex);spec.attributeIndex=request.attributeIndex;spec:AllocNode(node) end
      elseif request.action=='jewel'then
        assert(node.alloc and slot,'An allocated original jewel socket is required')
        if request.jewelItemId==nil then result.diagnostics[#result.diagnostics+1]={code='tree-jewel-required',message='Choose an original slot item or None.'}
        else
          local valid=false;for _,id in ipairs(slot.items)do if id==request.jewelItemId then valid=true end end
          assert(valid,'Original PoB rejected this item for the jewel socket')
          slot:SetSelItemId(request.jewelItemId);build.itemsTab:PopulateSlots();spec:BuildAllDependsAndPaths()
        end
      elseif request.action=='allocate'then
        local path=spec:GetEffectiveAllocationPath(node)
        for _,entry in ipairs(path or {})do result.path[#result.path+1]=entry.id end
        if node.type=='Mastery'then result.diagnostics[#result.diagnostics+1]={code='tree-choice-required',message='Original mastery selection is required; this control is not connected yet.'}
        elseif node.isAttribute and not request.attributeIndex then result.diagnostics[#result.diagnostics+1]={code='tree-attribute-required',message='Choose an original attribute option before allocating this node.'}
        elseif not path then result.diagnostics[#result.diagnostics+1]={code='tree-no-path',message='Original PoB has no allocation path for this mode and configuration.'}
        else
          if request.attributeIndex then assert(node.options and node.options[request.attributeIndex],'Unknown original attribute option');spec:SwitchAttributeNode(node.id,request.attributeIndex);spec.attributeIndex=request.attributeIndex end
          spec:AllocNode(node)
        end
      elseif request.action=='deallocate'then
        if node.alloc then spec:DeallocNode(node) end
      end
    elseif request.action~='character' then
      result.nodes=array()
      for id,entry in pairs(spec.nodes)do result.nodes[#result.nodes+1]={id=id,name=StripEscapes(entry.dn or ''),allocated=not not entry.alloc,mode=entry.allocMode or 0,pathLength=entry.path and #entry.path or -1,type=entry.type or '',isAttribute=not not entry.isAttribute}end
      table.sort(result.nodes,function(a,b)return a.id<b.id end)
    end
    local after=state(spec)
    result.patch={attributes=differences(before.attributes,after.attributes),weaponSets=differences(before.weaponSets,after.weaponSets),attributeOverrides=differences(before.attributeOverrides,after.attributeOverrides),sockets=differences(before.sockets,after.sockets)}
    if request.action=='character' and not decision then local saved={};build:Save(saved);result.patch.buildAttributes={className=saved.attrib.className,ascendClassName=saved.attrib.ascendClassName}end
    -- A newly created AttributeOverride requires all three fields in PoB's loader.
    if next(result.patch.attributeOverrides)then result.patch.attributeOverrides=after.attributeOverrides end
    if before.url~=after.url then result.patch.url=after.url end
    for id in pairs(spec.allocNodes)do if not old[id]then result.added[#result.added+1]=id end end
    for id in pairs(old)do if not spec.allocNodes[id]then result.removed[#result.removed+1]=id end end
    table.sort(result.added);table.sort(result.removed)
    if request.nodeId and (next(result.patch.attributeOverrides) or next(result.patch.sockets))then result.modified[#result.modified+1]=request.nodeId end
    result.pointDisplay={text=StripEscapes(build.controls.pointDisplay.str or ''),help=StripEscapes(build.controls.pointDisplay.req or '')}
    result.jewelSockets=array()
    for id,slot in pairs(build.itemsTab.sockets)do
      local node=spec.nodes[id]
      if node then result.jewelSockets[#result.jewelSockets+1]={nodeId=id,name=StripEscapes(node.dn or ''),allocated=not not node.alloc,itemId=slot.selItemId or 0}end
    end
    table.sort(result.jewelSockets,function(a,b)return a.nodeId<b.nodeId end)
    local normal,asc,secondary,sockets,weapon1,weapon2=spec:CountAllocNodes()
    result.counts={normal=normal,ascendancy=asc,secondaryAscendancy=secondary,sockets=sockets,weapon1=weapon1,weapon2=weapon2}
    return result
  end
end
