-- Original Build owns title/link matching and all coordinated set switching.
return function(editor,manager,treeWorkspace,skillGroups)
  local function array()return setmetatable({},{__jsontype='array'})end
  local function selection(value)return{tree=tostring(value.specId),items=tostring(value.itemSetId),skills=tostring(value.skillSetId),config=tostring(value.configSetId)}end
  return function(request)
    local skills
    if request.skillGroups then
      assert(not request.manage and not request.name and not request.treeWorkspace,'Skill group request is ambiguous')
      skills=skillGroups(request)
    else editor.load(request.xml)end
    build:SyncLoadouts()
    local plan,confirmation,loadoutChanges,movement,treePatches,workspace
    if request.treeWorkspace then assert(not request.manage and not request.name,'Tree workspace request is ambiguous');plan,treePatches,workspace=treeWorkspace(request)end
    if request.manage then plan,confirmation,loadoutChanges,movement=manager.apply(request.manage)end
    build:SyncLoadouts()
    local choices,diagnostics=manager.choices()
    if request.name and not request.manage then
      local found;for _,choice in ipairs(choices)do if choice.name==request.name then found=choice end end
      assert(found,'Original PoB does not offer this complete loadout')
      build:SetActiveLoadout(assert(build:GetLoadoutByName(request.name)))
    end
    local saved={};build:Save(saved)
    local current={specId=build.treeTab.activeSpec,itemSetId=build.itemsTab.activeItemSetId,skillSetId=build.skillsTab.activeSkillSetId,configSetId=build.configTab.activeConfigSetId}
    local activeName
    for _,choice in ipairs(choices)do local value=choice.selection;if value.tree==tostring(current.specId) and value.items==tostring(current.itemSetId) and value.skills==tostring(current.skillSetId) and value.config==tostring(current.configSetId)then activeName=choice.name;break end end
    return{skillGroups=skills,choices=choices,selection=selection(current),activeName=activeName,requestedName=request.name,identity={className=saved.attrib.className,ascendClassName=saved.attrib.ascendClassName},equipment={useSecondWeaponSet=not not build.itemsTab.activeItemSet.useSecondWeaponSet,mainSocketGroup=build.mainSocketGroup},diagnostics=diagnostics,management=manager.inspect(),sets=plan,operation=request.manage,confirmation=confirmation,loadoutChanges=loadoutChanges,movement=movement,treePatches=treePatches,treeWorkspace=workspace}
  end
end
