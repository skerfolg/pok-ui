-- Run the original equipment controls; never infer slot, weapon or skill rules.
return function(editor)
  local function array()return setmetatable({},{__jsontype='array'})end
  local function state(tab)
    local slots={};for _,slot in ipairs(tab.orderedSlots)do if not slot.nodeId then slots[slot.slotName]=tostring(slot.selItemId or 0)end end
    return{slots=slots,useSecondWeaponSet=not not tab.activeItemSet.useSecondWeaponSet,mainSocketGroup=tab.build.mainSocketGroup}
  end
  return function(request,current)
    if not current then editor.ensure(request.xml)end;local tab=build.itemsTab;tab:PopulateSlots();local before=state(tab)
    if request.action=='weapon'then
      assert(request.weaponSet==1 or request.weaponSet==2,'Unknown original weapon set')
      tab.controls['weaponSwap'..request.weaponSet].onClick()
    elseif request.action=='equip'then
      local slot=tab.slots[request.slot];assert(slot and not slot.nodeId,'Unknown original equipment slot')
      assert(slot:IsShown(),'Original equipment slot is hidden; select its active weapon set or parent item first')
      local id=tonumber(request.itemId);assert(id,'Original item ID is required')
      if id==0 then slot.selIndex=1;slot.selFunc(1,slot.list[1])
      else local item=assert(tab.items[id],'Original stored item was not found');assert(slot:CanReceiveDrag('Item',item),'Original PoB rejected this item for slot '..request.slot);slot:ReceiveDrag('Item',item)end
    elseif request.action then error('Unknown original equipment action')end
    tab:PopulateSlots();local after=state(tab)
    local patch={slots={}}
    for name,id in pairs(after.slots)do if before.slots[name]~=id then patch.slots[name]=id end end
    if before.useSecondWeaponSet~=after.useSecondWeaponSet then patch.useSecondWeaponSet=after.useSecondWeaponSet end
    if before.mainSocketGroup~=after.mainSocketGroup then patch.mainSocketGroup=after.mainSocketGroup end
    local result={patch=patch,beforeSlots=before.slots,slots=array(),useSecondWeaponSet=after.useSecondWeaponSet,mainSocketGroup=after.mainSocketGroup,diagnostics=array()}
    for _,slot in ipairs(tab.orderedSlots)do if not slot.nodeId then
      local choices=array();for i,id in ipairs(slot.items)do choices[#choices+1]={id=tostring(id),label=StripEscapes(slot.list[i] or tostring(id))}end
      result.slots[#result.slots+1]={name=slot.slotName,label=StripEscapes(slot:GetProperty('label') or slot.slotName),parentSlot=slot.parentSlot and slot.parentSlot.slotName,weaponSet=slot.weaponSet,itemId=tostring(slot.selItemId or 0),visible=not not slot:IsShown(),enabled=not not slot:IsEnabled(),choices=choices}
    end end
    return result
  end
end
