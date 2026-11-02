-- Serialization only; allocation and conversion remain original PassiveSpec operations.
local api={}
function api.read(spec)
  local xml={elem='Spec'};spec:Save(xml)
  local result={attributes=xml.attrib,weaponSets={},attributeOverrides={},sockets={}}
  for _,node in ipairs(xml)do
    if node.elem=='URL'then result.url=node[1]
    elseif node.elem:match('^WeaponSet%d+$')then result.weaponSets[node.elem]=node.attrib.nodes or ''
    elseif node.elem=='Overrides'then for _,entry in ipairs(node)do if entry.elem=='AttributeOverride'then result.attributeOverrides=entry.attrib end end end
    if node.elem=='Sockets'then for _,entry in ipairs(node)do result.sockets[entry.attrib.nodeId]=entry.attrib.itemId end end
  end
  return result
end
function api.differences(a,b)
  local changes={};for key,value in pairs(b)do if a[key]~=value then changes[key]=value end end
  for key in pairs(a)do if b[key]==nil then changes[key]=''end end;return changes
end
function api.patch(a,b)
  local patch={attributes=api.differences(a.attributes,b.attributes),weaponSets=api.differences(a.weaponSets,b.weaponSets),attributeOverrides=api.differences(a.attributeOverrides,b.attributeOverrides),sockets=api.differences(a.sockets,b.sockets)}
  if next(patch.attributeOverrides)then patch.attributeOverrides=b.attributeOverrides end
  if a.url~=b.url then patch.url=b.url or ''end;return patch
end
function api.full(b)
  return{replaceState=true,attributes=b.attributes,url=b.url or '',weaponSets={WeaponSet1=b.weaponSets.WeaponSet1 or '',WeaponSet2=b.weaponSets.WeaponSet2 or ''},attributeOverrides=next(b.attributeOverrides)and b.attributeOverrides or{strNodes='',dexNodes='',intNodes=''},sockets=b.sockets}
end
return api
