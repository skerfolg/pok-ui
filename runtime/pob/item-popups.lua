-- Project original item popup controls. Candidate filtering and item mutation stay in PoB.
local api={}
local function array()return setmetatable({},{__jsontype='array'})end
local function text(value)return StripEscapes(tostring(value or ''))end
function api.actions(tab)
  local actions=array()
  for i=1,4 do local control=tab.controls['displayItemAnoint'..(i==1 and '' or i)];if control and control:IsShown()then actions[#actions+1]={kind='anoint',slot=i,label=text(control:GetProperty('label')),enabled=not not control:IsEnabled()}end end
  local control=tab.controls.displayItemCorrupt
  if control and control:IsShown()then actions[#actions+1]={kind='corrupt',label=text(control:GetProperty('label')),enabled=not not control:IsEnabled()}end
  control=tab.controls.displayItemAddCustom
  if control and control:IsShown()then actions[#actions+1]={kind='add',label=text(control:GetProperty('label')),enabled=not not control:IsEnabled()}end
  return actions
end
local function key(entry)
  if type(entry)=='string'then return 'value:'..entry end
  if entry.sourceId then return 'source:'..entry.sourceId end
  if entry.mod then
    for id,mod in pairs(data.itemMods.Corruption)do if mod==entry.mod then return 'mod:'..id end end
    local keys={};for category,mods in pairs(data.itemMods)do for id,mod in pairs(mods)do if mod==entry.mod then keys[#keys+1]='original:'..category..':'..id end end end;table.sort(keys);assert(keys[1],'Unknown original modifier');return keys[1]
  end
  if entry.stat then return 'stat:'..entry.stat end
  return 'value:'..tostring(entry.label or entry.name or '')
end
local function select(control,value)
  assert(control and control:IsShown(),'Original popup control is unavailable')
  if not control:IsEnabled()then assert(key(control.list[control.selIndex or 1])==value,'Original popup control is disabled');return end
  local selected
  for i,entry in ipairs(control.list)do if key(entry)==value then selected=i;break end end
  assert(selected,'Unknown or filtered original popup option')
  control.selIndex=selected;if control.selFunc then control.selFunc(selected,control.list[selected])end
end
local function selectField(id,label,control)
  local result={id=id,label=label,kind='select',value=key(control.list[control.selIndex or 1]),enabled=not not control:IsEnabled(),options=array()}
  for _,entry in ipairs(control.list)do
    local option={key=key(entry),label=text(type(entry)=='table' and (entry.label or entry.name) or entry)}
    if type(entry)=='table' and entry.mod then option.lines=array();for _,line in ipairs(entry.mod)do option.lines[#option.lines+1]=text(line)end end
    result.options[#result.options+1]=option
  end
  return result
end
function api.run(tab,request)
  assert(request.kind=='anoint' or request.kind=='corrupt' or request.kind=='add','Unknown original item popup')
  local button=tab.controls[request.kind=='anoint' and ('displayItemAnoint'..((request.slot or 1)==1 and '' or request.slot)) or request.kind=='add' and 'displayItemAddCustom' or 'displayItemCorrupt']
  assert(button and button:IsShown() and button:IsEnabled(),'Original item popup is unavailable')
  local captured,original
  original=main.OpenPopup
  main.OpenPopup=function(self,width,height,title,controls,...)captured=controls;return original(self,width,height,title,controls,...)end
  local worked,message=pcall(button.onClick);main.OpenPopup=original;assert(worked,message);assert(captured,'Original item popup was not created')
  local controls,values=captured,request.selections or {}
  local result={kind=request.kind,slot=request.slot or 1,fields=array(),modes=array(),comparison=array(),state={kind=request.kind,slot=request.slot or 1,selections={}}}
  if request.kind=='add'then
    for id in pairs(values)do assert(id=='source' or id=='sort' or id=='modSelect' or id=='custom','Unknown original modifier control')end
    for _,id in ipairs({'source','sort','modSelect'})do if values[id]then select(controls[id],values[id])end end
    if values.custom~=nil then local control=controls.custom;assert(control:IsShown() and control:IsEnabled() and type(values.custom)=='string' and #values.custom<=(control.limit or 1024),'Original custom modifier is unavailable');assert(not control.filterPattern or values.custom:gsub(control.filterPattern,'')==values.custom,'Original custom modifier filter rejected input');control:SetText(values.custom,true)end
    for _,id in ipairs({'source','sort','modSelect'})do if controls[id]:IsShown()then result.fields[#result.fields+1]=selectField(id,({source='옵션 출처',sort='정렬',modSelect='추가할 옵션'})[id],controls[id])end end
    if controls.custom:IsShown()then local control=controls.custom;result.fields[#result.fields+1]={id='custom',label='추가할 옵션',kind='edit',value=control.buf,enabled=not not control:IsEnabled(),limit=control.limit}end
  elseif request.kind=='anoint'then
    local db=controls.notableDB
    for id,value in pairs(values)do
      local control=db.controls[id]
      if id=='sort' or id=='searchMode'then select(control,value)
      elseif id:match('^emotionCheckbox') and control then assert(type(value)=='boolean','Original material filter requires a boolean');control.state=value;control.changeFunc(value)
      else error('Unknown original anoint filter')end
    end
    local query=request.query or '';assert(#query<=(db.controls.search.limit or 100),'Original anoint search limit exceeded');assert(query:gsub(db.controls.search.filterPattern,'')==query,'Original anoint search filter rejected input');db.controls.search:SetText(query,true)
    local builder=coroutine.create(db.ListBuilder)
    repeat local ok,err=coroutine.resume(builder,db);assert(ok,err) until coroutine.status(builder)=='dead'
    result.notables=array()
    for _,node in ipairs(db.list)do
      local stats,recipe=array(),array();for _,line in ipairs(node.sd or {})do stats[#stats+1]=text(line)end;for _,emotion in ipairs(node.recipe or {})do recipe[#recipe+1]=emotion end
      result.notables[#result.notables+1]={id=node.id,name=text(node.dn),stats=stats,recipe=recipe,allocated=not not tab.build.spec.allocNodes[node.id]}
      if node.id==request.nodeId then db.selValue=node end
    end
    if request.nodeId and request.nodeId~=0 then assert(db.selValue,'Anoint node is not in the original filtered list')end
    result.state.query=query;result.state.nodeId=request.nodeId
    for _,id in ipairs({'sort','searchMode'})do result.fields[#result.fields+1]=selectField(id,id,db.controls[id])end
    local ids={};for id in pairs(db.controls)do if type(id)=='string' and id:match('^emotionCheckbox')then ids[#ids+1]=id end end;table.sort(ids)
    for _,id in ipairs(ids)do local control=db.controls[id];result.fields[#result.fields+1]={id=id,label=text(control:GetProperty('tooltipText')),kind='check',value=not not control.state,enabled=not not control:IsEnabled()}end
    local collector={AddLine=function(self,size,line)result.comparison[#result.comparison+1]=text(line)end}
    tab:AppendAnointTooltip(collector,db.selValue)
  else
    for id in pairs(values)do assert(id=='source' or id=='sort' or id:match('^enchant%d+$') and controls[id] or id:match('^rollRangeSlider%d+$') and controls[id],'Unknown original corruption control')end
    for _,id in ipairs({'source','sort'})do if values[id]then select(controls[id],values[id])end end
    for i=1,8 do local id='enchant'..i;if values[id]then select(controls[id],values[id])end end
    if request.mode then
      assert(request.mode=='enchants' or request.mode=='rolls','Unknown original corruption mode')
      local mode=controls[request.mode]
      if mode and mode:IsShown() and mode:IsEnabled()then mode.onClick()else assert(request.mode=='enchants' and controls.enchant1:IsShown(),'Original corruption mode is unavailable')end
    end
    for id,value in pairs(values)do if id:match('^rollRangeSlider%d+$')then local control=controls[id];assert(control:IsShown() and control:IsEnabled() and type(value)=='number' and value==value and value~=math.huge and value~=-math.huge,'Original roll slider value is unavailable');control:SetVal(value)end end
    for _,mode in ipairs({'enchants','rolls'})do if controls[mode]:IsShown()then result.modes[#result.modes+1]={id=mode,label=text(controls[mode]:GetProperty('label'))}end end
    result.state.mode=controls.enchant1:IsShown() and 'enchants' or 'rolls'
    for _,id in ipairs({'source','sort'})do if controls[id]:IsShown()then result.fields[#result.fields+1]=selectField(id,id,controls[id])end end
    for i=1,8 do local id='enchant'..i;if controls[id]:IsShown()then result.fields[#result.fields+1]=selectField(id,text(controls[id..'Label']:GetProperty('label')),controls[id])end end
    local ids={};for id in pairs(controls)do if type(id)=='string' and id:match('^rollRangeSlider%d+$')then ids[#ids+1]=id end end;table.sort(ids)
    for _,id in ipairs(ids)do local control=controls[id];if control:IsShown()then local index=id:match('(%d+)$');result.fields[#result.fields+1]={id=id,kind='slider',label=text(controls['rollRangeLabel'..index]:GetProperty('label'))..' · '..text(controls['rollRangeValue'..index]:GetProperty('label')),value=control.val,enabled=not not control:IsEnabled()}end end
  end
  for id,value in pairs(values)do result.state.selections[id]=value end
  for _,field in ipairs(result.fields)do result.state.selections[field.id]=field.value end
  result.saveLabel=text(controls.save:GetProperty('label'));result.canCommit=not not controls.save:IsEnabled()
  if request.commit then assert(result.canCommit,'Original popup save is unavailable');controls.save.onClick();return nil end
  return result
end
return api
