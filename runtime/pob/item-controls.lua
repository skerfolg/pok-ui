-- Read/drive original item controls on a detached Item; canonical XML is host-owned.
return function(editor,popups)
  local function array()return setmetatable({},{__jsontype='array'})end
  local function text(value)return StripEscapes(tostring(value or ''))end
  local function optionKey(entry)
    if type(entry)~='table'then return nil end
    if entry.modId then return 'affix:'..entry.modId end
    if entry.modList then return 'series:'..table.concat(entry.modList,',')end
    return entry.name
  end
  return function(request)
    editor.load(request.xml)
    local tab=build.itemsTab
    local configured=tab.items[tonumber(request.itemId)]
    local raw=request.text==request.sourceText and configured and configured:BuildRaw() or request.text
    local item=new('Item',raw)
    assert(item.base,'Original PoB does not recognise this item base; source text is retained by the host')
    tab:SetDisplayItem(item)
    local definitions={
      {'displayItemQualityEdit','Quality','edit'},
      {'displayItemSocketRuneEdit','Augment Sockets','edit'},
      {'displayItemSocketJewelEdit','Jewel Sockets','edit'},
      {'displayItemCatalyst','Catalyst','select'},
      {'displayItemCatalystQualityEdit','Catalyst Quality','edit'},
      {'displayItemVariant','Variant','select'},
      {'displayItemClusterJewelSkill','Cluster Jewel Skill','select'},
    }
    for i=1,5 do definitions[#definitions+1]={'displayItemAltVariant'..(i==1 and '' or i),'Additional Variant '..i,'select'}end
    for i=1,6 do definitions[#definitions+1]={'displayItemRune'..i,'Rune '..i,'select'}end
    for i=1,9 do definitions[#definitions+1]={'displayItemAffix'..i,'Affix '..i,'select'};definitions[#definitions+1]={'displayItemAffixRange'..i,'Affix Tier / Roll '..i,'slider'}end
    for i,line in ipairs(item.rangeLineList or {})do definitions[#definitions+1]={'range:'..i,'Modifier Range '..i..' · '..text(line.line),'range',i}end
    local found
    for _,definition in ipairs(definitions)do if definition[1]==request.field then found=definition end end
    if request.field then
      assert(found,'Unsupported original item control')
      local control=found[3]=='range' and tab.controls.displayItemRangeSlider or tab.controls[found[1]]
      if found[3]=='range'then local selector=tab.controls.displayItemRangeLine;assert(selector:IsShown() and item.rangeLineList[found[4]],'Original modifier range is unavailable');selector.selIndex=found[4];selector.selFunc(found[4],selector.list[found[4]])end
      assert(control and control:IsShown() and control:IsEnabled(),'Original item control is not available for this item')
      if found[3]=='edit'then
        assert(type(request.value)=='string','Item control text is required')
        assert(not control.limit or #request.value<=control.limit,'Item control text exceeds the original input limit')
        assert(not control.filterPattern or request.value:gsub(control.filterPattern,'')==request.value,'Item control text fails the original filter')
        control:SetText(request.value,true)
      elseif found[3]=='slider' or found[3]=='range'then
        assert(type(request.value)=='number' and request.value==request.value and request.value~=math.huge and request.value~=-math.huge,'A finite original slider value is required');control:SetVal(request.value)
      else
        local index=request.value
        if type(index)=='string'then local name=index;index=nil;for i,entry in ipairs(control.list)do if optionKey(entry)==name or type(entry)=='string' and entry==name then index=i;break end end end
        assert(type(index)=='number' and index==math.floor(index) and control.list[index],'Unknown original item option')
        control.selIndex=index;control.selFunc(index,control.list[index])
      end
      tab:SetDisplayItem(item)
    end
    local popup
    if request.popup then popup=popups.run(tab,request.popup);item=tab.displayItem end
    for i=#definitions,1,-1 do if definitions[i][3]=='range'then table.remove(definitions,i)end end
    for i,line in ipairs(item.rangeLineList or {})do definitions[#definitions+1]={'range:'..i,'Modifier Range '..i..' · '..text(line.line),'range',i}end
    if request.slot then assert(tab.slots[request.slot],'Unknown original item slot');assert(tab:IsItemValidForSlot(item,request.slot),'Original PoB rejected this item for slot '..request.slot)end
    local sourceChanges,mappings,counts,order=array(),{},{},{}
    for _,source in ipairs({request.sourceText or request.text,request.text})do
      local seen={}
      for line in (source..'\n'):gmatch('(.-)\n')do
        line=line:gsub('\r$','');local sanitised=sanitiseText(line)
        if line~=sanitised then
          seen[line]=(seen[line] or 0)+1
          if not counts[line]then order[#order+1]=line;counts[line]=0 end
          counts[line]=math.max(counts[line],seen[line])
        end
      end
    end
    for _,line in ipairs(order)do local sanitised=sanitiseText(line);mappings[sanitised]=mappings[sanitised] or {};for i=1,counts[line]do sourceChanges[#sourceChanges+1]=line;mappings[sanitised][#mappings[sanitised]+1]=line end end
    local restored,used={},{}
    for line in (item:BuildRaw()..'\n'):gmatch('(.-)\n')do
      local index=(used[line] or 0)+1
      if mappings[line] and mappings[line][index]then used[line]=index;restored[#restored+1]=mappings[line][index]
      else restored[#restored+1]=line end
    end
    local preserved=true
    for key,lines in pairs(mappings)do if (used[key] or 0)<#lines then preserved=false end end
    local result={text=table.concat(restored,'\n'),sourcePreserved=preserved,validatedSlot=request.slot,fields=array(),diagnostics=array(),actions=popups.actions(tab),popup=popup}
    if #sourceChanges>0 then result.diagnostics[#result.diagnostics+1]={code='item-source-normalization',message=preserved and 'PoB sanitised these input lines. Their original text is retained; this is not translation or verified modelling.' or 'PoB changed input lines that could not be restored exactly. Applying this preview is blocked; the canonical source remains unchanged.',lines=sourceChanges}end
    for _,definition in ipairs(definitions)do
      local control=definition[3]=='range' and tab.controls.displayItemRangeSlider or tab.controls[definition[1]]
      if control and control:IsShown() and (definition[3]~='range' or tab.controls.displayItemRangeLine:IsShown())then
        local field={id=definition[1],label=definition[2],kind=definition[3]=='range' and 'slider' or definition[3],enabled=not not control:IsEnabled()}
        if field.kind=='edit'then field.value=control.buf;field.limit=control.limit;field.filter=control.filter
        elseif field.kind=='slider'then field.value=definition[3]=='range' and item.rangeLineList[definition[4]].range or control.val
        else
          field.value=control.selIndex or 1;field.options=array()
          for index,entry in ipairs(control.list or {})do
            local option={index=index,label=text(type(entry)=='table' and (entry.label or entry.name) or entry)}
            option.key=optionKey(entry)
            if type(entry)=='table' and entry.modList then option.description=array();for _,id in ipairs(entry.modList)do local mod=item.affixes[id];option.description[#option.description+1]=text((mod.affix or id)..' · '..table.concat(mod,' / '))end end
            if type(entry)=='table' and type(entry.name)=='string'then option.name=text(entry.name)end
            if type(entry)=='table' and entry.lines then option.description=array();for _,line in ipairs(entry.lines)do option.description[#option.description+1]=text(line)end end
            field.options[#field.options+1]=option
          end
        end
        if field.kind=='slider'then
          field.description=array()
          if definition[3]=='range'then field.description[#field.description+1]=text(itemLib.formatModLine(item.rangeLineList[definition[4]]))
          elseif control.tooltipFunc then local tooltip=new('Tooltip');local ok,message=pcall(control.tooltipFunc,tooltip,control.val);if ok then for _,line in ipairs(tooltip.lines)do if line.text then field.description[#field.description+1]=text(line.text)end end else result.diagnostics[#result.diagnostics+1]={code='item-range-tooltip',message=tostring(message)}end end
        end
        if definition[1]:match('^displayItemAffix%d+$')then local index=definition[1]:match('(%d+)$');field.label=text(tab.controls['displayItemAffixLabel'..index]:GetProperty('label'))..' '..index end
        result.fields[#result.fields+1]=field
      end
    end
    local unsupported=array()
    for _,list in ipairs({item.implicitModLines or {},item.explicitModLines or {},item.runeModLines or {},item.enchantModLines or {}})do for _,line in ipairs(list)do if line.extra then if mappings[line.line]then for _,original in ipairs(mappings[line.line])do unsupported[#unsupported+1]=original end else unsupported[#unsupported+1]=line.line end end end end
    if #unsupported>0 then result.diagnostics[#result.diagnostics+1]={code='item-unparsed-lines',message='These original lines are not modelled by PoB; keep them in review and verify the calculation.',lines=unsupported}end
    local id=tonumber(request.itemId);local previous=tab.items[id];tab.items[id]=item;local saved={elem='Items'};tab:Save(saved);tab.items[id]=previous
    result.metadata={variants={},modRanges={}}
    for _,node in ipairs(saved)do if node.elem=='Item' and node.attrib.id==tostring(id)then for key,value in pairs(node.attrib)do if key~='id'then result.metadata.variants[key]=value end end;for _,child in ipairs(node)do if type(child)=='table' and child.elem=='ModRange'then result.metadata.modRanges[child.attrib.id]=child.attrib.range end end end end
    return result
  end
end
