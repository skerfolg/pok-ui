-- Drive original management controls; retain object lineage for host-owned XML.
local function array()return setmetatable({},{__jsontype='array'})end
local function objects()
  local result={tree=array(),items=array(),skills=array(),config=array()}
  for id,value in ipairs(build.treeTab.specList)do result.tree[#result.tree+1]={id=tostring(id),value=value}end
  for _,definition in ipairs({{'items',build.itemsTab.itemSetOrderList,build.itemsTab.itemSets},{'skills',build.skillsTab.skillSetOrderList,build.skillsTab.skillSets},{'config',build.configTab.configSetOrderList,build.configTab.configSets}})do for _,id in ipairs(definition[2])do result[definition[1]][#result[definition[1]]+1]={id=tostring(id),value=assert(definition[3][id],'Original set ID has no object')}end end
  return result
end
local function node(value)
  local result={tag=value.elem,attributes=value.attrib or {},children=array()}
  for _,entry in ipairs(value)do result.children[#result.children+1]=type(entry)=='table' and node(entry) or tostring(entry)end
  return result
end
local function capture(work)
  local open,close,confirm=main.OpenPopup,main.ClosePopup,main.OpenConfirmPopup;local controls,confirmation
  main.OpenPopup=function(self,width,height,title,value)controls=value end
  main.ClosePopup=function()end
  main.OpenConfirmPopup=function(self,title,message,label,callback)confirmation=message;callback()end
  local ok,message=pcall(function()work(function()return controls end)end)
  main.OpenPopup,main.ClosePopup,main.OpenConfirmPopup=open,close,confirm
  assert(ok,message);return controls,confirmation
end
local api={}
function api.choices()
  local result,diagnostics=array(),array()
  local reserved={['^7^7Loadouts:']=true,['^7^7-----']=true,['^7^7Manage']=true,['^7^7Sync']=true,['^7^7Help >>']=true}
  for _,name in ipairs(build.controls.buildLoadouts.list)do if type(name)=='string' and not reserved[name]then
    local ok,value=pcall(build.GetLoadoutByName,build,name)
    if ok and value and value.specId and value.itemSetId and value.skillSetId and value.configSetId then result[#result+1]={name=name,label=StripEscapes(name),selection={tree=tostring(value.specId),items=tostring(value.itemSetId),skills=tostring(value.skillSetId),config=tostring(value.configSetId)}}
    elseif not ok then diagnostics[#diagnostics+1]={code='loadout-resolution',message=tostring(value),name=name}end
  end end
  return result,diagnostics
end
local function members(choice)
  local s=choice.selection
  return{build.treeTab.specList[tonumber(s.tree)],build.itemsTab.itemSets[tonumber(s.items)],build.skillsTab.skillSets[tonumber(s.skills)],build.configTab.configSets[tonumber(s.config)]}
end
local function choiceState()
  local result={};for _,choice in ipairs(api.choices())do result[choice.name]={choice=choice,members=members(choice)}end;return result
end
function api.inspect()
  local list,entries=new('BuildSetListControl',nil,{0,0,380,200},build),array()
  local listed={};local choices=api.choices()
  for index,spec in ipairs(list.list)do
    local id;for i,value in ipairs(build.treeTab.specList)do if value==spec then id=i end end;listed[spec]=true
    local actions={'rename','copy'};if #list.list>1 then actions[#actions+1]='delete';actions[#actions+1]='reorder'end
    local entry={index=index,tree=tostring(id),name=spec.title or 'Default',label=StripEscapes(spec.title or 'Default'),actions=actions}
    if #list.list<=1 then for _,choice in ipairs(choices)do if choice.selection.tree==tostring(id)then
      local successors=array();for _,candidate in ipairs(choices)do if candidate.selection.tree~=choice.selection.tree then successors[#successors+1]={name=candidate.name,label=candidate.label}end end
      if #successors>0 then entry.sourceName=choice.name;entry.namedActions={'delete'};entry.successors=successors;actions[#actions+1]='delete'end;break
    end end end
    entries[#entries+1]=entry
  end
  for _,choice in ipairs(choices)do if not listed[build.treeTab.specList[tonumber(choice.selection.tree)]]then
    local successors=array();for _,candidate in ipairs(choices)do if candidate.selection.tree~=choice.selection.tree then successors[#successors+1]={name=candidate.name,label=candidate.label}end end
    local actions={'rename','copy'};if #successors>0 then actions[#actions+1]='delete'end
    entries[#entries+1]={sourceName=choice.name,tree=choice.selection.tree,name=choice.name,label=choice.label,actions=actions,successors=successors}
  end end
  local controls=capture(function()list:NewLoadout()end)
  return{entries=entries,nameLimit=controls.edit.limit}
end
function api.apply(request)
  local before,source,copies,wrappers=objects(),{},{},{}
  local beforeChoices=choiceState()
  for kind,entries in pairs(before)do source[kind]={};for _,entry in ipairs(entries)do source[kind][entry.value]={id=entry.id,title=entry.value.title}end end
  for _,definition in ipairs({{'tree',build.treeTab,'CopyTree','specList'},{'items',build.itemsTab,'CopyItemSet','itemSets'},{'skills',build.skillsTab,'CopySkillSet','skillSets'},{'config',build.configTab,'CopyConfigSet','configSets'}})do
    local kind,tab,method,field=unpack(definition);local original=tab[method];wrappers[#wrappers+1]={tab,method,original}
    tab[method]=function(self,id,name)local origin=source[kind][self[field][id]];assert(origin,'Original copy source has no XML lineage');local value=original(self,id,name);copies[value]={kind=kind,id=origin.id};return value end
  end
  local ok,plan,confirmation,delta=pcall(function()
    local list=new('BuildSetListControl',nil,{0,0,380,200},build)
    local action=request.action;local spec=request.index and list.list[request.index];local named=request.sourceName and beforeChoices[request.sourceName]
    if request.sourceName then assert(not request.index and named,'Original named management source is unavailable');assert(action=='rename' or action=='copy' or action=='delete','Original list reorder is unavailable for this named source')end
    if action~='new' and action~='custom'then assert(spec or named,'Original management entry is unavailable')end
    local _,confirmation=capture(function(getControls)
      if action=='new'then list:NewLoadout()
      elseif action=='copy'then list:CopyLoadout(request.sourceName or spec.title or 'Default')
      elseif action=='rename'then list:RenameLoadout(request.sourceName or spec.title or 'Default')
      elseif action=='custom'then list:CustomLoadout({specId=0,itemSetId=0,skillSetId=0,configSetId=0})
      elseif action=='delete'then
        if named then
          local survivor=assert(request.nextName and beforeChoices[request.nextName],'Choose an original surviving Loadout')
          assert(survivor.members[1]~=named.members[1],'The surviving Loadout uses the spec being deleted')
          main:OpenConfirmPopup('Delete Loadout','Delete '..request.sourceName..'\nContinue with '..request.nextName,'Delete',function()
            build:DeleteLoadout(request.sourceName,request.nextName);build:SyncLoadouts()
            assert(choiceState()[request.nextName],'Original surviving Loadout is no longer available')
            build:SetActiveLoadout(assert(build:GetLoadoutByName(request.nextName)))
          end)
          local active={build.spec,build.itemsTab.activeItemSet,build.skillsTab.skillSets[build.skillsTab.activeSkillSetId],build.configTab.configSets[build.configTab.activeConfigSetId]}
          for i=1,4 do assert(active[i]==survivor.members[i],'Original deletion changed the requested surviving configuration')end
        else assert(#list.list>1,'Original last Loadout cannot be deleted');list:DeleteLoadout(request.index,spec)end
      elseif action=='reorder'then
        assert(request.position and list.list[request.position],'Original destination is unavailable')
        local moved=table.remove(list.list,request.index);table.insert(list.list,request.position,moved);list:OnOrderChange(request.index,request.position)
      else error('Unknown original Loadout management action')end
      if action=='new' or action=='copy' or action=='rename' or action=='custom'then
        local controls=assert(getControls(),'Original name controls were not opened')
        if action=='custom'then
          local fields={{'tree','treeDropDown',build.treeTab.specList},{'items','itemDropDown',build.itemsTab.itemSetOrderList},{'skills','skillDropDown',build.skillsTab.skillSetOrderList},{'config','configDropDown',build.configTab.configSetOrderList}}
          for _,field in ipairs(fields)do local selected=assert(request.sources and request.sources[field[1]],'Custom copy source is required');local index=1
            if selected~='new'then index=nil;for i,id in ipairs(field[3])do if tostring(field[1]=='tree' and i or id)==selected then index=i+1 end end;assert(index,'Original custom source is unavailable')end
            controls[field[2]]:SetSel(index)
          end
        end
        assert(type(request.title)=='string','Original Loadout name is required');controls.edit:SetText(request.title,true)
        assert(controls.edit.buf==request.title,'Original name input changed the requested text')
        assert(controls.save:IsEnabled(),'Original Loadout name is already used or unavailable');controls.save.onClick()
      end
    end)
    build:SyncLoadouts();local after,result=objects(),{}
    for kind,entries in pairs(after)do
      result[kind]=array();local seen,ids={},{}
      local tab=kind=='tree' and build.treeTab or kind=='items' and build.itemsTab or kind=='skills' and build.skillsTab or build.configTab
      local saved={};tab:Save(saved);local nodes={};local tag=kind=='tree' and 'Spec' or kind=='items' and 'ItemSet' or kind=='skills' and 'SkillSet' or 'ConfigSet'
      for _,value in ipairs(saved)do if value.elem==tag then nodes[#nodes+1]=value end end
      for index,entry in ipairs(entries)do
        assert(not ids[entry.id],'Original management produced duplicate set IDs');ids[entry.id]=true;seen[entry.value]=true
        local original,copy,out=source[kind][entry.value],copies[entry.value],{id=entry.id}
        if original then out.sourceId=original.id;if original.title~=entry.value.title then out.title=entry.value.title or ''end
        elseif copy then assert(copy.kind==kind);out.copyFrom=copy.id;out.title=entry.value.title or ''
        else out.node=node(assert(nodes[index],'Original new set serialization is missing'))end
        result[kind][#result[kind]+1]=out
      end
      if action~='delete'then for value in pairs(source[kind])do assert(seen[value],'Original management unexpectedly removed an existing set')end end
      assert(#entries>0,'Original management removed every set')
    end
    local afterChoices=choiceState();local delta={added=array(),removed=array(),changed=array()}
    for name,old in pairs(beforeChoices)do local now=afterChoices[name];if not now then delta.removed[#delta.removed+1]={name=name,label=old.choice.label}else for i=1,4 do if old.members[i]~=now.members[i]then delta.changed[#delta.changed+1]={name=name,label=now.choice.label};break end end end end
    for name,now in pairs(afterChoices)do if not beforeChoices[name]then delta.added[#delta.added+1]={name=name,label=now.choice.label}end end
    return result,confirmation,delta
  end)
  for _,entry in ipairs(wrappers)do entry[1][entry[2]]=entry[3]end
  assert(ok,plan);return plan,confirmation,delta
end
return api
