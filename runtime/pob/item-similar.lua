-- Project the unmodified CompareBuySimilar controls; upstream owns stat IDs,
-- categories, numeric filters and URL generation. No network or browser in Lua.
local function array()return setmetatable({},{__jsontype='array'})end
local function text(value)return StripEscapes(tostring(value or ''))end
return function(item,slot,request)
  local previousPopup,previousTrade,previousOpen,previousCopy=main.OpenPopup,build.itemsTab.tradeQuery,OpenURL,Copy
  local captured,url
  local ok,result=pcall(function()
    if not slot then for _,candidate in ipairs(build.itemsTab.orderedSlots)do if build.itemsTab:IsItemValidForSlot(item,candidate.slotName)then slot=candidate.slotName;break end end end
    local module=LoadModule('Classes/CompareBuySimilar')
    module.lastRealmIdx=nil;module.lastLeagueIdx=nil;module.lastListedIndex=nil
    -- League discovery is host I/O. Use the user's explicit name plus the
    -- upstream offline defaults; never claim these are a current league list.
    build.itemsTab.tradeQuery={tradeQueryRequests={FetchLeagues=function(_,realm,callback)callback(request.league and {request.league} or {})end}}
    main.OpenPopup=function(_,width,height,title,controls)captured=controls end
    OpenURL=function(value)url=value end;Copy=function()end
    module.openPopup(item,slot,build)
    local controls=assert(captured,'Original Buy Similar popup is unavailable')
    if request.league then
      local found
      for index,value in ipairs(controls.leagueDrop.list)do if value==request.league then controls.leagueDrop:SetSel(index);found=true;break end end
      assert(found,'Original league selection is unavailable')
    end
    local function kind(id)
      if id=='listedDrop'then return 'select' end
      if id=='baseTypeCheck' or id:match('^def%d+Check$') or id:match('^mod%d+Check$')then return 'check' end
      if id:match('^ilvlM[inax]+$') or id:match('^def%d+M[inax]+$') or id:match('^mod%d+M[inax]+$')then return 'edit' end
    end
    for id,value in pairs(request.selections or {})do
      local control,fieldKind=controls[id],kind(id)
      assert(control and fieldKind,'Original search control is unavailable: '..id)
      if not control:IsEnabled()then
        local original=control.buf
        if fieldKind=='check'then original=not not control.state elseif fieldKind=='select'then original=control.selIndex end
        assert(value==original,'Original search control is unavailable: '..id)
      elseif fieldKind=='check'then assert(type(value)=='boolean','Search checkbox requires a boolean');control.state=value;control.changeFunc(value)
      elseif fieldKind=='select'then assert(type(value)=='number' and value==math.floor(value) and control.list[value],'Unknown original search option');control:SetSel(value)
      else
        assert(type(value)=='string' and #value<=(control.limit or 100),'Original numeric search text limit exceeded')
        assert(not control.filterPattern or value:gsub(control.filterPattern,'')==value,'Original numeric search filter rejected input')
        control:SetText(value,true)
      end
    end
    assert(controls.search:IsEnabled(),'Original search URL is unavailable');controls.search.onClick()
    local response={url=assert(url),realm=controls.realmDrop:GetSelValue(),league=controls.leagueDrop:GetSelValue(),slot=slot,rows=array(),state={league=controls.leagueDrop:GetSelValue(),selections={}}}
    local function row(id,label,ids)
      local fields=array()
      for _,key in ipairs(ids)do local control=controls[key];if control then
        local field={id=key,kind=kind(key),enabled=not not control:IsEnabled()}
        if field.kind=='select'then field.value=control.selIndex;field.options=array();for index,value in ipairs(control.list)do field.options[#field.options+1]={index=index,label=text(value)}end
        elseif field.kind=='check'then field.value=not not control.state
        else field.value=control.buf;field.limit=control.limit;field.filter=control.filterPattern end
        response.state.selections[key]=field.value;fields[#fields+1]=field
      end end
      if #fields>0 then response.rows[#response.rows+1]={id=id,label=text(label),fields=fields}end
    end
    row('listed','매물 상태',{'listedDrop'})
    row('base',controls.baseTypeLabel and controls.baseTypeLabel:GetProperty('label'),{'baseTypeCheck'})
    row('level','아이템 레벨',{'ilvlMin','ilvlMax'})
    local prefixes={}
    for id in pairs(controls)do local prefix=id:match('^(def%d+)Check$') or id:match('^(mod%d+)Check$');if prefix then prefixes[#prefixes+1]=prefix end end
    table.sort(prefixes,function(a,b)local ak,an=a:match('(%a+)(%d+)');local bk,bn=b:match('(%a+)(%d+)');return ak==bk and tonumber(an)<tonumber(bn) or ak<bk end)
    for _,prefix in ipairs(prefixes)do row(prefix,controls[prefix..'Label']:GetProperty('label'),{prefix..'Check',prefix..'Min',prefix..'Max'})end
    return response
  end)
  main.OpenPopup=previousPopup;build.itemsTab.tradeQuery=previousTrade;OpenURL=previousOpen;Copy=previousCopy
  assert(ok,result);return result
end
