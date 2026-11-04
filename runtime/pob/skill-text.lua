-- Observe the unmodified text interchange. Every line probe reloads the input,
-- so parser-created groups/minion lists cannot contaminate another probe.
local function array()return setmetatable({},{__jsontype='array'})end
local function paste(tab,text)
  local previous=Paste;Paste=function()return text end
  local ok,message=pcall(tab.PasteSocketGroup,tab);Paste=previous;return ok,message
end
local function gem(value)return{name=value.nameSpec,error=value.errMsg,level=value.level,quality=value.quality,enabled=value.enabled,count=value.count}end
local function node(value)
  local out={tag=value.elem,attributes={},children=array()}
  for key,text in pairs(value.attrib or {})do out.attributes[key]=tostring(text)end
  for _,entry in ipairs(value)do out.children[#out.children+1]=type(entry)=='table'and node(entry)or tostring(entry)end
  return out
end
local api={}
function api.analyze(editor,xml,text)
  assert(type(text)=='string'and#text<=65536,'Skill text must be at most 65536 UTF-8 bytes')
  local lines,accepted=array(),array()
  for raw in (text:gsub('\r\n','\n'):gsub('\r','\n')..'\n'):gmatch('(.-)\n')do
    assert(#lines<128,'Skill text must have at most 128 lines')
    local entry={index=#lines+1,text=raw,status='other',gems=array()};lines[#lines+1]=entry
    if raw:match('^%s*$')then entry.status='blank'
    else
      editor.load(xml);local tab=build.skillsTab;local before=#tab.socketGroupList;local ok,message=paste(tab,raw)
      if not ok then entry.status='error';entry.error=tostring(message)
      elseif #tab.socketGroupList==before+1 then
        entry.status='gem';for _,value in ipairs(tab.socketGroupList[before+1].gemList)do entry.gems[#entry.gems+1]=gem(value);accepted[#accepted+1]=value.nameSpec;if value.errMsg then entry.status='unsupported'end end
      end
    end
  end
  editor.load(xml);local tab=build.skillsTab;local before=#tab.socketGroupList;local ok,message=paste(tab,text)
  local group=ok and tab.socketGroupList[before+1];local warnings=array();local verified=not not group
  if not ok then warnings[#warnings+1]='원본 텍스트 복원 오류: '..tostring(message)
  elseif not group then warnings[#warnings+1]='원본 PoB가 추가할 젬 그룹을 만들지 못했습니다.'
  else
    if #group.gemList~=#accepted then verified=false end
    for index,value in ipairs(group.gemList)do if value.nameSpec~=accepted[index]then verified=false end end
    if not verified then warnings[#warnings+1]='줄별 관측과 전체 원본 파싱 결과가 달라 적용할 수 없습니다.'end
  end
  local partial=false
  for _,entry in ipairs(lines)do
    if entry.status=='other'and group and(entry.text=='Label: '..(group.label or '')or entry.text=='Slot: '..(group.slot or ''))then entry.status='metadata'end
    if entry.status=='other'or entry.status=='error'or entry.status=='unsupported'then partial=true end
  end
  if partial then warnings[#warnings+1]='미해석/미지원 줄이 있습니다. 원문을 보존하며 부분 반영으로 검토해 주세요.'end
  return{raw=text,lines=lines,warnings=warnings,partial=partial,canApply=verified}
end
function api.apply(tab,text)
  local spectres,beasts={},{};for _,id in ipairs(build.spectreList)do spectres[id]=true end;for _,id in ipairs(build.beastList)do beasts[id]=true end
  local before=#tab.socketGroupList;local ok,message=paste(tab,text);assert(ok,message)
  local group=assert(tab.socketGroupList[before+1],'Original paste produced no group');assert(#tab.socketGroupList==before+1,'Original paste added more than one group')
  local additions=array();for _,row in ipairs({{'Spectre',build.spectreList,spectres},{'BeastCompanion',build.beastList,beasts}})do for _,id in ipairs(row[2])do if not row[3][id]then additions[#additions+1]={tag=row[1],id=id}end end end
  return group,additions
end
function api.saved(tab,index)
  local saved={};tab:Save(saved)
  for _,set in ipairs(saved)do if set.elem=='SkillSet'and tonumber(set.attrib.id)==tab.activeSkillSetId then
    local count=0;for _,value in ipairs(set)do if value.elem=='Skill'then count=count+1;if count==index then return node(value)end end end
  end end;error('Original saved skill group is unavailable')
end
function api.export(tab,group)
  local previous=Copy;local text;Copy=function(value)text=value end
  local ok,message=pcall(tab.CopySocketGroup,tab,group);Copy=previous;assert(ok,message);assert(type(text)=='string','Original copy did not return text')
  return{raw=text,lines=array(),canApply=false,partial=false,warnings={'PoB 텍스트는 그룹/젬의 전체 XML·효과 선택·알 수 없는 필드를 보존하는 형식이 아닙니다. 전체 XML 복제와 구분해 사용하세요.'}}
end
return api
