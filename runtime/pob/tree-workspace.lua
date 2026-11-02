-- Original version popup/callbacks, with canonical XML object lineage for the host.
return function(states)
  local function array()return setmetatable({},{__jsontype='array'})end
  local function node(value)local out={tag=value.elem,attributes=value.attrib or {},children=array()};for _,entry in ipairs(value)do out.children[#out.children+1]=type(entry)=='table'and node(entry)or tostring(entry)end;return out end
  local function objects()
    local out={tree=array(),items=array(),skills=array(),config=array()}
    for id,value in ipairs(build.treeTab.specList)do out.tree[#out.tree+1]={id=tostring(id),value=value}end
    for _,row in ipairs({{'items',build.itemsTab.itemSetOrderList,build.itemsTab.itemSets},{'skills',build.skillsTab.skillSetOrderList,build.skillsTab.skillSets},{'config',build.configTab.configSetOrderList,build.configTab.configSets}})do for _,id in ipairs(row[2])do out[row[1]][#out[row[1]]+1]={id=tostring(id),value=row[3][id]}end end;return out
  end
  local function popup(work)
    local open,close,copy=main.OpenPopup,main.ClosePopup,Copy;local controls,copied
    main.OpenPopup=function(self,w,h,title,value)controls=value;return{SelectControl=function()end}end;main.ClosePopup=function()end;Copy=function(value)copied=value end
    local ok,message=pcall(function()work(function()return controls end)end);main.OpenPopup,main.ClosePopup,Copy=open,close,copy;assert(ok,message);return controls,copied
  end
  local function decode(spec,text)
    local missing,seen=array(),{};local allocate=spec.AllocateDecodedNodes
    spec.AllocateDecodedNodes=function(self,...)
      local nodes,meta=self.nodes,getmetatable(self.nodes);assert(not meta,'Original node table already has lookup behavior')
      setmetatable(nodes,{__index=function(_,id)if type(id)=='number'and not seen[id]then missing[#missing+1]=id;seen[id]=true end end})
      local ok,message=pcall(allocate,self,...);setmetatable(nodes,meta);assert(ok,message)
    end
    local ok,message=pcall(spec.DecodeURL,spec,text);spec.AllocateDecodedNodes=allocate;assert(ok,message);assert(not message,message);table.sort(missing);return missing
  end
  return function(request)
    local operation=request.treeWorkspace;assert(type(operation)=='table','Original tree workspace operation is required')
    local action=operation.action;assert(action=='inspect'or action=='initialize'or action=='convert'or action=='convert-all'or action=='adopt'or action=='import-code'or action=='export-code','Unknown original tree workspace operation')
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
    if action=='export-code'then
      assert(not metadata.initializationRequired,'Create or import a canonical tree before exporting')
      local active=build.spec;local controls,text=popup(function(get)build.treeTab:OpenExportPopup();assert(get().copy,'Original export copy control is unavailable');get().copy.onClick()end);assert(type(text)=='string'and#text>0,'Original export did not provide a tree code')
      local restored=new('PassiveSpec',build,active.treeVersion);local decoded,missing=pcall(decode,restored,text);local warnings=array();local saved=states.read(active)
      if not decoded then warnings[#warnings+1]='원본 코드 왕복 복원을 확인하지 못했습니다: '..tostring(missing);missing=array()end
      if next(saved.weaponSets)then warnings[#warnings+1]='무기별 할당 구분은 원본 트리 코드에 포함되지 않습니다.'end
      for _,value in pairs(saved.attributeOverrides)do if value~=''then warnings[#warnings+1]='능력치 노드 선택은 원본 트리 코드에 포함되지 않습니다.';break end end
      if next(saved.sockets)then warnings[#warnings+1]='장착 주얼은 원본 트리 코드에 포함되지 않습니다.'end
      if decoded then for id in pairs(active.allocNodes)do if not restored.allocNodes[id]then if not isValueInArray(missing,id)then missing[#missing+1]=id end end end;table.sort(missing)
        if active.curClassId~=restored.curClassId or active.curAscendClassId~=restored.curAscendClassId or(active.curSecondaryAscendClassId or 0)~=(restored.curSecondaryAscendClassId or 0)then warnings[#warnings+1]='원본 코드의 직업/전직 왕복 결과가 현재 트리와 다릅니다.'end
      end
      local sourceNodes=array();for id in pairs(active.allocNodes)do sourceNodes[#sourceNodes+1]=id end;table.sort(sourceNodes)
      assert(build.spec==active,'Original code export changed the active tree');metadata.treeCode={text=text,version=active.treeVersion,warnings=warnings,missingNodes=missing,sourceNodes=sourceNodes}
    elseif action=='import-code'then
      local valid=false;for _,version in ipairs(versions)do if version.id==operation.version then valid=true end end;assert(valid,'Choose the original tree version for this versionless code')
      assert(type(operation.code)=='string'and#operation.code>0,'Original tree code is required');assert(not operation.code:match('poeurl%.com/')and not operation.code:match('poeplanner%.com/'),'Short links and PoEPlanner formats require a separate original decoder/network contract; paste the original PoB/GGG tree code')
      local controls=popup(function(get)build.treeTab:OpenImportPopup();get().name:SetText(assert(operation.title,'Original import name is required'),true);get().edit:SetText(operation.code,true);assert(get().name.buf==operation.title and get().edit.buf==operation.code and get().import:IsEnabled(),'Original tree import fields are unavailable')end)
      local imported=new('PassiveSpec',build,operation.version);local missing=decode(imported,controls.edit.buf);imported.title=controls.name.buf;table.insert(build.treeTab.specList,imported);build.treeTab:SetActiveSpec(#build.treeTab.specList);build.treeTab.modFlag=true;build.buildFlag=true;imported:AddUndoState()
      metadata.treeCode={version=imported.treeVersion,missingNodes=missing,warnings=array()};metadata.treeCode.warnings[1]='트리 전용 복원입니다. 주얼·능력치 선택·무기별 할당·장비·스킬·조건은 코드에 포함되지 않을 수 있습니다.'
    elseif action=='adopt'then
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
