-- Party parsing, support export and append/replace semantics belong to stock PoB.
return function(editor)
  local fields={
    {'PartyMemberStats','editPartyMemberStats'}, {'Aura','editAuras','simpleAuras'},
    {'Curse','editCurses','simpleCurses'}, {'Warcry Skills','editWarcries','simpleWarcries'},
    {'Link Skills','editLinks','simpleLinks'}, {'EnemyConditions','enemyCond','simpleEnemyCond'},
    {'EnemyMods','enemyMods','simpleEnemyMods'},
  }
  local function exported()
    build.partyTab.enableExportBuffs=true;build.calcsTab:BuildOutput()
    local node={elem='Party',attrib={}};build.partyTab:Save(node)
    local party={elem='Party',attrib={}}
    for _,entry in ipairs(node) do if entry.elem=='ExportedBuffs' then party[#party+1]=entry end end
    return party
  end
  return function(request)
    local support
    if request.supportXml then
      editor.load(request.supportXml)
      local root={elem='PathOfBuilding2',attrib={},exported()}
      support=assert(common.xml.ComposeXML(root))
    end
    editor.load(request.xml)
    local tab=build.partyTab
    if request.action=='import' or request.action=='clear' then
      local found
      for i,name in ipairs(tab.controls.importCodeDestination.list) do if name==(request.destination or 'All') then found=i end end
      assert(found,'Unsupported party destination');tab.controls.importCodeDestination.selIndex=found
      tab.controls.appendNotReplace.state=not not request.append
      if request.action=='import' then
        assert(support,'Support build XML is required')
        tab.importCodeXML=support;tab.importCodeValid=true;tab.importCodeSite=nil
        tab.controls.importCodeGo.onClick()
      else tab.controls.clear.onClick() end
    end
    local result={buffers={},exports={},summaries={},destinations=setmetatable({},{__jsontype='array'}),diagnostics=setmetatable({},{__jsontype='array'}),exportEnabled=tab.enableExportBuffs,help=StripEscapes(tab.controls.notesDesc.label)}
    for _,name in ipairs(tab.controls.importCodeDestination.list) do result.destinations[#result.destinations+1]=name end
    for _,field in ipairs(fields) do
      local name,control,summary=unpack(field);result.buffers[name]=tab.controls[control].buf
      if summary then result.summaries[name]=StripEscapes(tab.controls[summary].label or '') end
      local actor=tab.actor[name=='Warcry Skills' and 'Warcry' or name=='Link Skills' and 'Link' or name]
      if actor and actor.Unknown and next(actor.Unknown) then result.diagnostics[#result.diagnostics+1]={code='party-unclassified-effect',field=name,message='Original PoB parsed an effect into its Unknown category. Check the source export and calculated result; the text is retained.'} end
      if name~='PartyMemberStats' then
        local index=0
        for line in (result.buffers[name]..'\n'):gmatch('(.-)\n') do
          index=index+1
          if line:find('|') then
            local ok,mod=pcall(modLib.parseFormattedSourceMod,line)
            if not ok or not mod then result.diagnostics[#result.diagnostics+1]={code='party-unparsed-line',field=name,line=index,message='Original PoB did not parse this formatted modifier; its source text is retained.'} end
          end
        end
      end
    end
    for _,entry in ipairs(exported()) do result.exports[entry.attrib.name]=entry[1] or '' end
    return result
  end
end
