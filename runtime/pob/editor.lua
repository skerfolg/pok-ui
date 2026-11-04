-- Metadata and item editing bridge. Data selection, parsing, ranges and crafting
-- are delegated to the unmodified PoB objects; no game rules are duplicated.
local json=require('dkjson')
local api={}
local delegated=0
local function raw(value,seen,depth)
  local kind=type(value)
  if kind=='nil' then return json.null end
  if kind=='number' then
    if value~=value or value==math.huge or value==-math.huge then return {pobValue=tostring(value)} end
    return value
  end
  if kind=='string' or kind=='boolean' then return value end
  if kind~='table' then delegated=delegated+1;return {pobValue=kind,executedBy='PoB'} end
  if seen[value] or depth>14 then delegated=delegated+1;return {pobValue='reference',executedBy='PoB'} end
  seen[value]=true
  local out={}
  for key,entry in pairs(value) do
    if type(key)=='string' or type(key)=='number' then
      -- These are linked runtime skill objects, not gem identity metadata.
      if key=='grantedEffect' or key=='secondaryGrantedEffect' then out[key]={pobValue='skill-reference',id=entry.id or entry.name,executedBy='PoB'}
      else out[tostring(key)]=raw(entry,seen,depth+1) end
    end
  end
  seen[value]=nil
  return setmetatable(out,{__jsontype='object'})
end
local function array() return setmetatable({},{__jsontype='array'}) end
local function setup(xml)
  local previous=launch.ShowErrMsg
  local errors={}
  launch.ShowErrMsg=function(self,format,...)errors[#errors+1]=string.format(format,...)end
  local worked,message=pcall(function()if xml then loadBuildFromXML(xml,'POK UI editor') else newBuild() end end)
  launch.ShowErrMsg=previous
  assert(worked,message)
  assert(#errors==0,'PoB XML load failed: '..table.concat(errors,'\n'))
  assert(build and build.spec and build.data,'PoB editor did not initialise')
  for i=1,5000 do
    if not main.uniqueDB or not main.uniqueDB.loading then break end
    runCallback('OnFrame')
  end
end
api.load=setup
function api.itemLines(item)
  local lines=array()
  for _,list in ipairs({item.enchantModLines,item.runeModLines,item.implicitModLines,item.explicitModLines})do
    local count=#lines
    for _,modLine in ipairs(list or {})do
      for i=1,item:GetModLineVariantCount(modLine)do
        local line=itemLib.formatModLine(modLine)
        if line then lines[#lines+1]=StripEscapes(line)end
      end
    end
    if #lines>count then lines[#lines+1]='---'end
  end
  if lines[#lines]=='---'then table.remove(lines)end
  return lines
end
function api.catalog()
  setup();delegated=0
  local classes,entries=array(),array()
  for id,class in pairs(build.spec.tree.classes) do
    if type(id)=='number' then
      local asc=array()
      for ascId,entry in pairs(class.classes or {}) do
        if type(ascId)=='number' and ascId>0 then asc[#asc+1]={id=entry.internalId or entry.id or entry.name,name=entry.name,legacyId=ascId} end
      end
      table.sort(asc,function(a,b)return a.legacyId<b.legacyId end)
      classes[#classes+1]={id=class.name,name=class.name,legacyId=id,internalId=class.integerId,ascendancies=asc,startNodeId=class.startNodeId and tostring(class.startNodeId)}
    end
  end
  table.sort(classes,function(a,b)return a.legacyId<b.legacyId end)
  local function entry(kind,id,name,category,value,extra)
    local row={type=kind,id=id,name=name,category=category,raw=raw(value,{},0)}
    for key,v in pairs(extra or {}) do row[key]=v end
    entries[#entries+1]=row
  end
  for name,base in pairs(build.data.itemBases) do entry('base',name,name,base.type,base,{subType=base.subType}) end
  for id,gem in pairs(build.data.gems) do entry('gem',id,gem.name,gem.grantedEffect and gem.grantedEffect.support and 'Support' or gem.gemType,gem,{gemId=id,gameId=gem.gameId}) end
  for id,skill in pairs(build.data.skills) do entry('skill',id,skill.name or id,skill.support and 'Support' or 'Skill',skill) end
  assert(main.uniqueDB and main.uniqueDB.list and not main.uniqueDB.loading,'PoB unique catalogue is not ready')
  for id,item in pairs(main.uniqueDB.list) do
    local variants=array()
    for index,name in ipairs(item.variantList or {}) do variants[#variants+1]={id=tostring(index),name=name} end
    entry('unique','unique:'..id,item.title or item.name or id,item.type,{text=item.raw},{subType=item.baseName,variants=variants})
  end
  for category,mods in pairs(build.data.itemMods) do
    for id,mod in pairs(mods) do
      if type(id)=='string' and type(mod)=='table' then entry('mod','mod:'..category..':'..id,mod.affix or id,mod.type or category,mod) end
    end
  end
  table.sort(entries,function(a,b)if a.type==b.type then return a.id<b.id end return a.type<b.type end)
  return {schemaVersion=1,defaultTreeVersion=latestTreeVersion,supportedTreeVersions=treeVersionList,classes=classes,entries=entries,
    diagnostics={{code='runtime-delegated-values',count=delegated,handling='PoB executes linked/function values; catalogue is display metadata'}}}
end
function api.item(args)
  assert(type(args)=='table' and type(args.id)=='string','Item request/id is required')
  setup(args.buildXml)
  local item
  if args.kind=='unique' then
    local original=main.uniqueDB.list[args.id:gsub('^unique:','')]
    assert(original,'Unknown PoB unique item')
    item=new('Item',original.raw)
    if args.variants and #args.variants>0 then
      assert(#args.variants==1,'Select exactly one primary variant')
      local variant=tonumber(args.variants[1]);assert(variant and item.variantList and item.variantList[variant],'Unknown unique variant')
      item.variant=variant;item:BuildAndParseRaw()
    elseif item.variantList and #item.variantList>1 then error('A unique variant must be selected') end
  elseif args.kind=='base' or args.kind=='rare' then
    local base=assert(build.data.itemBases[args.id],'Unknown PoB base item')
    local rarity=args.kind=='rare' and 'RARE' or 'NORMAL'
    local name=args.name or 'Crafted Item'
    assert(type(name)=='string' and not name:find('[\r\n]'),'Item name must be a single line')
    local text='Rarity: '..rarity..'\n'..(args.kind=='rare' and name..'\n' or '')..args.id
    local implicits={};for line in (base.implicit or ''):gmatch('[^\n]+') do implicits[#implicits+1]=line end
    text=text..'\nImplicits: '..#implicits..'\n'..table.concat(implicits,'\n')
    item=new('Item',text)
    assert(item.base,'PoB did not parse this base')
    if args.kind=='rare' then
      item.crafted=true;item:BuildAndParseRaw()
      local counters={Prefix=0,Suffix=0}
      for _,id in ipairs(args.mods or {}) do
        local category,key=id:match('^mod:([^:]+):(.+)$')
        local mod=category and build.data.itemMods[category] and build.data.itemMods[category][key]
        assert(mod and (mod.type=='Prefix' or mod.type=='Suffix'),'Select a PoB prefix or suffix')
        assert(item.affixes[key]==mod,'This modifier is not available to the selected PoB item')
        local list=mod.type=='Prefix' and item.prefixes or item.suffixes
        counters[mod.type]=counters[mod.type]+1;local index=counters[mod.type]
        assert(index<=(list.limit or item.affixLimit/2),'PoB affix slot limit exceeded')
        local roll=args.rolls and args.rolls[id]
        assert(roll==nil or type(roll)=='number' and roll>=0 and roll<=1,'Modifier roll must be between 0 and 1')
        list[index]={modId=key,range=roll}
      end
      item:Craft()
    end
  else error('Unsupported item kind') end
  assert(args.quality==nil,'Edit quality with original item controls after creating the draft')
  if args.slot then
    assert(type(args.slot)=='string' and build.itemsTab.slots[args.slot],'Unknown PoB item slot')
    assert(build.itemsTab:IsItemValidForSlot(item,args.slot),'PoB item is not valid for slot '..args.slot)
  end
  local unsupported=array()
  for _,list in ipairs({item.implicitModLines or {},item.explicitModLines or {},item.runeModLines or {},item.enchantModLines or {}}) do
    for _,line in ipairs(list) do if line.extra then unsupported[#unsupported+1]=line.line end end
  end
  return {ok=true,text=item:BuildRaw(),diagnostics={{code='pob-item-parser',unsupported=unsupported}},kind=args.kind}
end
function api.treeSource(version)
  local valid=false;for _,candidate in ipairs(treeVersionList)do if candidate==version then valid=true end end
  assert(valid,'Unsupported original tree version')
  return{version=version,tree=LoadModule('TreeData/'..version..'/tree')}
end
return api
