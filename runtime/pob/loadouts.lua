-- Original Build owns title/link matching and all coordinated set switching.
return function(editor)
  local function array()return setmetatable({},{__jsontype='array'})end
  local function selection(value)return{tree=tostring(value.specId),items=tostring(value.itemSetId),skills=tostring(value.skillSetId),config=tostring(value.configSetId)}end
  return function(request)
    editor.load(request.xml);build:SyncLoadouts()
    local choices,diagnostics=array(),array()
    local reserved={['^7^7Loadouts:']=true,['^7^7-----']=true,['^7^7Manage']=true,['^7^7Sync']=true,['^7^7Help >>']=true}
    for _,name in ipairs(build.controls.buildLoadouts.list)do
      if type(name)=='string' and not reserved[name]then
        local ok,value=pcall(build.GetLoadoutByName,build,name)
        if ok and value and value.specId and value.itemSetId and value.skillSetId and value.configSetId then choices[#choices+1]={name=name,label=StripEscapes(name),selection=selection(value)}
        elseif not ok then diagnostics[#diagnostics+1]={code='loadout-resolution',message=tostring(value),name=name}end
      end
    end
    if request.name then
      local found;for _,choice in ipairs(choices)do if choice.name==request.name then found=choice end end
      assert(found,'Original PoB does not offer this complete loadout')
      build:SetActiveLoadout(assert(build:GetLoadoutByName(request.name)))
    end
    local saved={};build:Save(saved)
    local current={specId=build.treeTab.activeSpec,itemSetId=build.itemsTab.activeItemSetId,skillSetId=build.skillsTab.activeSkillSetId,configSetId=build.configTab.activeConfigSetId}
    local activeName
    for _,choice in ipairs(choices)do local value=choice.selection;if value.tree==tostring(current.specId) and value.items==tostring(current.itemSetId) and value.skills==tostring(current.skillSetId) and value.config==tostring(current.configSetId)then activeName=choice.name;break end end
    return{choices=choices,selection=selection(current),activeName=activeName,requestedName=request.name,identity={className=saved.attrib.className,ascendClassName=saved.attrib.ascendClassName},equipment={useSecondWeaponSet=not not build.itemsTab.activeItemSet.useSecondWeaponSet,mainSocketGroup=build.mainSocketGroup},diagnostics=diagnostics}
  end
end
