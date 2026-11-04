-- Observe stock comparison formatting/calculation; no game rules live here.
return function(editor)
  local function array()return setmetatable({},{__jsontype='array'})end
  return function(request)
    editor.load(request.xml)
    build.calcsTab:BuildOutput()
    local tab=build.itemsTab
    tab:PopulateSlots()
    local item=assert(tab.items[tonumber(request.itemId)],'Original stored item was not found')
    local slot
    if request.slot then
      slot=assert(tab.slots[request.slot],'Unknown original tooltip slot')
      assert(tab:IsItemValidForSlot(item,request.slot),'Original item is not valid for this tooltip slot')
    elseif request.nodeId then
      for _,candidate in pairs(tab.slots)do if candidate.nodeId==request.nodeId then slot=candidate;break end end
      assert(slot,'Original jewel socket was not found')
      assert(tab:IsItemValidForSlot(item,slot.slotName),'Original item is not valid for this jewel socket')
    end
    local result={comparisons=array(),requirements=array()}
    local original,slotOnly=build.AddStatComparesToTooltip,main.slotOnlyTooltips
    build.AddStatComparesToTooltip=function(self,tooltip,before,after,header,...)
      local start=#tooltip.lines
      local count=original(self,tooltip,before,after,header,...)
      local section={header=StripEscapes(header or ''),lines=array()}
      for i=start+1,#tooltip.lines do
        local line=tooltip.lines[i]
        if line.text then section.lines[#section.lines+1]=StripEscapes(line.text)end
      end
      result.comparisons[#result.comparisons+1]=section
      return count
    end
    tab.showStatDifferences=true
    main.slotOnlyTooltips=slot~=nil
    local worked,message=pcall(function()tab:AddItemTooltip(new('Tooltip'),item,slot)end)
    build.AddStatComparesToTooltip=original;main.slotOnlyTooltips=slotOnly
    if not worked then error(message)end
    if item.requirements then
      local requirements=new('Tooltip');local req=item.requirements
      build:AddRequirementsToTooltip(requirements,req.level,req.strMod,req.dexMod,req.intMod,req.str or 0,req.dex or 0,req.int or 0)
      for _,line in ipairs(requirements.lines)do if line.text then result.requirements[#result.requirements+1]=StripEscapes(line.text)end end
    end
    return result
  end
end
