-- Original SkillListControl owns reordering/deletion and both skill selectors.
-- Observe LoadSkill object identity; never match groups by their display names.
return function(editor,textApi)
  local function array()return setmetatable({},{__jsontype='array'})end
  return function(request)
    local operation=assert(request.skillGroups,'Skill group operation is required')
    assert(operation.action=='inspect'or operation.action=='reorder'or operation.action=='delete'or operation.action=='copy'or operation.action=='move'or operation.action=='import-text'or operation.action=='export-text','Unknown skill group operation')
    local text=operation.action=='import-text'and textApi.analyze(editor,request.xml,operation.text)or nil
    if not common.classes.SkillsTab then LoadModule('Classes/SkillsTab')end
    local class=common.classes.SkillsTab;local load=class.LoadSkill
    local source,counts={},{}
    class.LoadSkill=function(self,node,id)
      load(self,node,id)
      if node.elem=='Skill'then
        local list=self.skillSets[id].socketGroupList;local key=tostring(id)
        counts[key]=(counts[key]or 0)+1
        source[assert(list[#list],'Original skill load produced no group')]={setId=key,id=tostring(counts[key]),node=node}
      end
    end
    local ok,message=pcall(editor.load,request.xml);class.LoadSkill=load;assert(ok,message)
    local tab=build.skillsTab;local setId=tostring(tab.activeSkillSetId)
    assert(setId==operation.setId,'Skill group operation must target the active original set')
    local list=tab.socketGroupList;local expected=assert(request.canonicalSkillGroups,'Canonical skill group inventory is required')
    assert(#list==#expected,'Original restored skill groups differ from canonical XML; explicit generated-group lineage is required')
    local function inventory(id)
      local skillSet=assert(tab.skillSets[tonumber(id)],'Original destination skill set is unavailable')
      local canonical=assert(request.canonicalSkillSets and request.canonicalSkillSets[id],'Canonical destination skill set is unavailable')
      assert(#skillSet.socketGroupList==#canonical,'Original destination groups differ from canonical XML')
      for index,value in ipairs(skillSet.socketGroupList)do local origin=assert(source[value],'Original generated destination group has no XML lineage');assert(origin.setId==id and origin.id==canonical[index],'Original destination group lineage changed during load')end
      return skillSet
    end
    local sets=array();for _,id in ipairs(tab.skillSetOrderList)do local value=tab.skillSets[id];sets[#sets+1]={id=tostring(id),label=StripEscapes(value.title or tostring(id)),count=#value.socketGroupList}end
    local initial,groups={},array()
    for index,value in ipairs(list)do
      local origin=assert(source[value],'Original generated skill group has no canonical XML lineage')
      assert(origin.setId==setId and expected[index]==origin.id,'Original skill group lineage changed during load')
      initial[origin.id]=value
      groups[#groups+1]={id=origin.id,label=StripEscapes(value.displayLabel or value.label or ''),source=value.source,canDelete=not value.source,canCopy=not value.source}
    end
    local control=new('SkillListControl',nil,{0,0,350,200},tab)
    local confirmation,transfer
    local imported
    if operation.action=='import-text'then
      if text.canApply then imported,text.companions=textApi.apply(tab,operation.text);source[imported]={id='new'}end
    elseif operation.action~='inspect'then
      local target=assert(initial[operation.groupId],'Original skill group source is unavailable')
      local index=isValueInArray(list,target);control.selIndex=index;control.selValue=target
      if operation.action=='export-text'then assert(not target.source,'Original item-generated group cannot be copied');text=textApi.export(tab,target)
      elseif operation.action=='copy'or operation.action=='move'then
        assert(not target.source,'Original item-generated skill group cannot be copied or moved')
        local destination=inventory(operation.targetSetId)
        assert(operation.action~='move'or operation.targetSetId~=setId,'Use original reorder for movement within the same set')
        local count=#destination.socketGroupList
        -- Reload the complete observed XML through the original parser, rather
        -- than the lossy CopySocketGroup text interchange. The host clones the
        -- same canonical node, including fields unknown to this PoB version.
        tab:LoadSkill(assert(source[target].node),destination.id)
        assert(#destination.socketGroupList==count+1,'Original skill copy did not append exactly one group')
        local copied=destination.socketGroupList[count+1];assert(copied~=target,'Original skill copy reused its source object');source[copied]=source[target]
        transfer={sourceSetId=setId,sourceGroupId=operation.groupId,targetSetId=operation.targetSetId,targetGroupId=tostring(count+1),move=operation.action=='move'}
      end
      if operation.action=='reorder'then
        local position=operation.position
        assert(type(position)=='number'and position==math.floor(position)and list[position],'Original skill group destination is unavailable')
        assert(position~=index,'Original skill group is already at this position')
        control.selDragging=true;control.selDragActive=true;control.selDragIndex=position>index and position+1 or position
        control:OnKeyUp('LEFTBUTTON');assert(list[position]==target,'Original skill group drag did not reach its destination')
      elseif operation.action=='delete'or operation.action=='move'then
        assert(control.controls.delete:IsEnabled(),'Original skill group deletion is disabled')
        local confirm=main.OpenConfirmPopup
        main.OpenConfirmPopup=function(self,title,text,label,callback)confirmation=text;callback()end
        local worked,reason=pcall(control.OnSelDelete,control,index,target);main.OpenConfirmPopup=confirm;assert(worked,reason)
        assert(not isValueInArray(list,target),'Original skill group was not deleted')
      end
    end
    -- Original CalcSetup clamps selectors after deleting the last/only group.
    build.calcsTab:BuildOutput()
    if imported then
      build:RefreshStatList()
      text.node=textApi.saved(tab,#list);text.groupId=tostring(#list);text.stats={};text.calcWarnings=array()
      for key,value in pairs(build.calcsTab.mainOutput or {})do if type(value)=='number'and value==value and value~=math.huge and value~=-math.huge then text.stats[key]=value end end
      for _,value in ipairs(build.controls.warnings and build.controls.warnings.lines or {})do if type(value)=='string'then text.calcWarnings[#text.calcWarnings+1]=value end end
    end
    local order=array();for _,value in ipairs(list)do order[#order+1]=assert(source[value],'Original operation introduced an untracked skill group').id end
    return{operation=operation,setId=setId,groups=groups,sets=sets,transfer=transfer,text=text,order=order,mainSocketGroup=build.mainSocketGroup,calcsSkillNumber=build.calcsTab.input.skill_number,confirmation=confirmation}
  end
end
