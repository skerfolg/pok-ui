-- Original version popup/callbacks, with canonical XML object lineage for the host.
return function(states)
  local function array()return setmetatable({},{__jsontype='array'})end
  local function node(value)local out={tag=value.elem,attributes=value.attrib or {},children=array()};for _,entry in ipairs(value)do out.children[#out.children+1]=type(entry)=='table'and node(entry)or tostring(entry)end;return out end
  local function objects()
    local out={tree=array(),items=array(),skills=array(),config=array()}
    for id,value in ipairs(build.treeTab.specList)do out.tree[#out.tree+1]={id=tostring(id),value=value}end
    for _,row in ipairs({{'items',build.itemsTab.itemSetOrderList,build.itemsTab.itemSets},{'skills',build.skillsTab.skillSetOrderList,build.skillsTab.skillSets},{'config',build.configTab.configSetOrderList,build.configTab.configSets}})do for _,id in ipairs(row[2])do out[row[1]][#out[row[1]]+1]={id=tostring(id),value=row[3][id]}end end;return out
  end
  return function(request)
    local operation=request.treeWorkspace;assert(type(operation)=='table','Original tree workspace operation is required')
    local action=operation.action;assert(action=='inspect'or action=='initialize'or action=='convert'or action=='convert-all'or action=='adopt','Unknown original tree workspace operation')
    local before,source,lineage,patches,changes=objects(),{},{},array(),array()
    local activeOthers={build.itemsTab.activeItemSet,build.skillsTab.skillSets[build.skillsTab.activeSkillSetId],build.configTab.configSets[build.configTab.activeConfigSetId]}
    for kind,entries in pairs(before)do source[kind]={};local ids={};for _,id in ipairs(assert(request.canonicalSets[kind],'Canonical set inventory is required'))do ids[id]=true end;for _,entry in ipairs(entries)do if ids[entry.id]then source[kind][entry.value]=entry.id end end end
    local versions=array()
    for _,entry in ipairs(build.treeTab.treeVersions)do
      main:LoadTree(entry.value);build:UpdateClassDropdowns(entry.value);local classes=array()
      for _,class in ipairs(build.controls.classDrop.list)do local ascendancies=array();for _,asc in ipairs(class.ascendancies)do ascendancies[#ascendancies+1]={id=asc.ascendClassId,label=StripEscapes(asc.label)}end;classes[#classes+1]={id=class.classId,label=StripEscapes(class.label),ascendancies=ascendancies}end
      versions[#versions+1]={id=entry.value,label=StripEscapes(entry.label),classes=classes}
    end
    build:UpdateClassDropdowns(build.spec.treeVersion)
    local trees=array();for _,entry in ipairs(before.tree)do trees[#trees+1]={id=entry.id,title=entry.value.title or 'Default',version=entry.value.treeVersion,active=entry.value==build.spec}end
    local metadata={operation=operation,versions=versions,trees=trees,initializationRequired=#request.canonicalSets.tree==0,changes=changes}
    if action=='adopt'then
      assert(#before.tree==1 and source.tree[build.spec]=='1','Legacy source does not match the original single spec');patches[#patches+1]={id='1',patch=states.full(states.read(build.spec))}
      metadata.warning='Legacy Spec was loaded by the original PoB loader. Its restored version and known fields will be saved in Tree/Spec format; the source XML remains available for undo.'
    elseif action~='inspect'then
      local valid=false;for _,version in ipairs(versions)do if version.id==operation.version then valid=true end end;assert(valid,'Original target tree version is unavailable')
      local open,close,confirm,convert=main.OpenPopup,main.ClosePopup,main.OpenConfirmPopup,build.treeTab.ConvertToVersion;local controls,warning
      main.OpenPopup=function(self,w,h,title,value)controls=value;warning=value.warningLabel and StripEscapes(value.warningLabel.label)end
      main.ClosePopup=function()end
      main.OpenConfirmPopup=function(self,title,message,label,callback)assert(action=='initialize','Unexpected original conversion confirmation');callback()end
      build.treeTab.ConvertToVersion=function(self,version,remove,...)
        local old=build.spec;local id=source.tree[old];local oldState=states.read(old);local oldNodes={};for nodeId in pairs(old.allocNodes)do oldNodes[nodeId]=true end
        convert(self,version,remove,...);local converted=build.spec
        assert(converted~=old,'Original conversion did not create a new spec')
        if id then lineage[converted]={id=id,replace=remove,patch=states.full(states.read(converted))}end
        local added,removed=array(),array();for nodeId in pairs(converted.allocNodes)do if not oldNodes[nodeId]then added[#added+1]=nodeId end end;for nodeId in pairs(oldNodes)do if not converted.allocNodes[nodeId]then removed[#removed+1]=nodeId end end;table.sort(added);table.sort(removed)
        changes[#changes+1]={sourceId=id,from=old.treeVersion,to=converted.treeVersion,title=old.title or 'Default',added=added,removed=removed}
      end
      local ok,message=pcall(function()
        if action=='initialize'then
          assert(metadata.initializationRequired and #before.tree==1,'A canonical tree already exists')
          if build.spec.treeVersion~=operation.version then build.treeTab:OpenVersionConvertPopup(operation.version,true);assert(controls and controls.convert);controls.convert.onClick()end
          build:UpdateClassDropdowns(build.spec.treeVersion);local selected,index
          for i,entry in ipairs(build.controls.classDrop.list)do if entry.classId==operation.classId then selected=entry;index=i end end;assert(selected,'Choose an original initial class')
          build.controls.classDrop.selFunc(index,selected);local asc
          for _,entry in ipairs(selected.ascendancies)do if entry.ascendClassId==operation.ascendancyId then asc=entry end end;assert(asc,'Choose an original initial ascendancy');build.controls.ascendDrop.selFunc(1,asc)
          local control=new('PassiveSpecListControl',nil,{0,0,350,200},build.treeTab);control:RenameSpec(build.spec,'Name Initial Tree')
          assert(type(operation.title)=='string','Initial tree name is required');controls.edit:SetText(operation.title,true);assert(controls.edit.buf==operation.title and controls.save:IsEnabled(),'Original initial tree name is unavailable');controls.save.onClick()
        else
          assert(not metadata.initializationRequired,'Initialize a canonical tree before converting')
          if action=='convert'then
            assert(operation.mode=='replace'or operation.mode=='copy','Choose replace or copy conversion');assert(operation.version~=build.spec.treeVersion,'Original tree already uses this version')
            local index,entry;for i,value in ipairs(build.treeTab.treeVersions)do if value.value==operation.version then index=i;entry=value end end
            build.treeTab.controls.versionSelect.selFunc(index,entry);assert(controls and controls.convertCopy,'Original version popup was not opened');controls[operation.mode=='copy'and'convertCopy'or'convert'].onClick()
          else
            local different=false;for _,entry in ipairs(before.tree)do if entry.value.treeVersion~=operation.version then different=true end end;assert(different,'All original trees already use this version')
            build.treeTab:OpenVersionConvertAllPopup(operation.version);assert(controls and controls.convert);controls.convert.onClick()
          end
        end
      end)
      main.OpenPopup,main.ClosePopup,main.OpenConfirmPopup,build.treeTab.ConvertToVersion=open,close,confirm,convert;assert(ok,message);metadata.warning=warning
    end
    metadata.nonTreeSelectionPreserved=build.itemsTab.activeItemSet==activeOthers[1]and build.skillsTab.skillSets[build.skillsTab.activeSkillSetId]==activeOthers[2]and build.configTab.configSets[build.configTab.activeConfigSetId]==activeOthers[3]
    local after,sets=objects(),{}
    for kind,entries in pairs(after)do
      sets[kind]=array();local tab=kind=='tree'and build.treeTab or kind=='items'and build.itemsTab or kind=='skills'and build.skillsTab or build.configTab
      local saved={};tab:Save(saved);local savedNodes={};local tag=kind=='tree'and'Spec'or kind=='items'and'ItemSet'or kind=='skills'and'SkillSet'or'ConfigSet';for _,value in ipairs(saved)do if value.elem==tag then savedNodes[#savedNodes+1]=value end end
      for index,entry in ipairs(entries)do
        local origin,converted=source[kind][entry.value],lineage[entry.value];local out={id=entry.id}
        if origin then out.sourceId=origin elseif converted then out[converted.replace and'sourceId'or'copyFrom']=converted.id;patches[#patches+1]={id=entry.id,patch=converted.patch}else out.node=node(assert(savedNodes[index],'Original default set serialization is missing'))end
        sets[kind][#sets[kind]+1]=out
      end
    end
    return sets,patches,metadata
  end
end
