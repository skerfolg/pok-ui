-- Read formatted cells and breakdowns through original Calcs controls.
-- No calculation, modifier grouping or formatting rules are reproduced here.
return function(editor)
  local function array() return setmetatable({},{__jsontype='array'}) end
  local function text(value) return value==nil and '' or StripEscapes(tostring(value)) end
  return function(xml,cellId)
    editor.read(xml);local previousView=build.viewMode;build.viewMode='CALCS'
    local tab=build.calcsTab
    local result={sections=array(),diagnostics=array(),selectors={group=tab.input.skill_number,mode=tab.input.misc_buffMode,showMinion=not not tab.input.showMinion,groups=array(),modes=array(),minionAvailable=tab.calcsEnv.minion~=nil}}
    local function attempt(field,fn)
      local ok,value=pcall(fn)
      if ok then return value end
      result.diagnostics[#result.diagnostics+1]={code='calcs-unavailable',field=field,message=tostring(value)}
    end
    local selectSection=tab.sectionList[1]
    attempt('selectors',function()selectSection:updateFunc()end)
    for i,group in ipairs(build.skillsTab.socketGroupList) do result.selectors.groups[#result.selectors.groups+1]={index=i,label=text(group.label and group.label~='' and group.label or ('Group '..i))} end
    for _,mode in ipairs(selectSection.controls.mode.list) do result.selectors.modes[#result.selectors.modes+1]={value=mode.buffMode,label=text(mode.label)} end
    result.selectors.modeHelp=text(selectSection.controls.mode:GetProperty('tooltipText'))
    attempt('skill-selectors',function()
      if tab.input.showMinion and not tab.calcsEnv.minion then return end
      for _,sub in ipairs(selectSection.subSection) do sub.collapsed=false end
      selectSection:UpdateSize()
      local controls=selectSection.controls
      local group=build.skillsTab.socketGroupList[tab.input.skill_number]
      if not group then return end
      local skill={groupId=tostring(tab.input.skill_number),activeSkill=group.mainActiveSkillCalcs or 1,skills=array(),modes=array(),parts=array(),gems=array(),selectedMode=1,selectedPart=1}
      result.selectors.skill=skill
      for i,gem in ipairs(group.gemList) do skill.gems[#skill.gems+1]={index=i,name=gem.nameSpec,error=gem.errMsg,level=gem.level,quality=gem.quality} end
      for i,entry in ipairs(controls.mainSkill.list) do skill.skills[#skill.skills+1]={index=i,label=text(entry.label)} end
      local active=group.displaySkillListCalcs and group.displaySkillListCalcs[skill.activeSkill]
      local effect=active and active.activeEffect
      if effect then
        skill.grantedEffectId=effect.grantedEffect.id
        for i,gem in ipairs(group.gemList) do if gem==effect.srcInstance then skill.sourceGemIndex=i end end
        for i,entry in ipairs(controls.statSet.list) do skill.modes[#skill.modes+1]={index=i,label=text(entry.label),grantedEffectId=entry.grantedEffectId} end
        skill.selectedMode=controls.statSet.selIndex or 1
        if controls.mainSkillPart:IsShown() then
          for i,entry in ipairs(controls.mainSkillPart.list) do skill.parts[#skill.parts+1]={index=i,label=text(entry.label)} end
          skill.selectedPart=controls.mainSkillPart.selIndex or 1
        end
        if controls.mainSkillStageCount:IsShown() then skill.stages=tonumber(controls.mainSkillStageCount.buf) end
        if controls.mainSkillMineCount:IsShown() then skill.minesAvailable=true;skill.mines=tonumber(controls.mainSkillMineCount.buf) end
      end
    end)
    if tab.input.showMinion and not tab.calcsEnv.minion then
      result.diagnostics[#result.diagnostics+1]={code='calcs-actor-unavailable',message='The selected minion actor is unavailable. Select player to inspect its calculations.'}
      build.viewMode=previousView
    return result
    end
    local actor=tab.input.showMinion and tab.calcsEnv.minion or tab.calcsEnv.player
    local selected
    for sectionIndex,section in ipairs(tab.sectionList) do
      if attempt(section.id,function()return tab:CheckFlag(section)end) then
        local dto={id=section.id,group=section.group,width=section.widthCols,subsections=array()}
        for subIndex,sub in ipairs(section.subSection) do
          local subsection={id=sub.id,label=text(sub.label),extra=sub.data.extra and attempt(sub.id,function()return text(formatCalcStr(sub.data.extra,actor))end),rows=array()}
          for rowIndex,row in ipairs(sub.data) do
            if attempt(section.id..':'..rowIndex,function()return tab:CheckFlag(row)end) then
              local line={label=text(row.label),cells=array()}
              for columnIndex,column in ipairs(row) do
                if column.format then
                  local id=table.concat({sectionIndex,subIndex,rowIndex,columnIndex},':')
                  local available=attempt(id,function()return tab:CheckFlag(column)end)
                  local formatted=available and attempt(id,function()return text(formatCalcStr(column.format,actor,column))end)
                  line.cells[#line.cells+1]={id=id,text=formatted or '',breakdown=not not (available and #column>0)}
                  if id==cellId and available then selected=column end
                end
              end
              if #line.cells>0 then subsection.rows[#subsection.rows+1]=line end
            end
          end
          if #subsection.rows>0 then dto.subsections[#dto.subsections+1]=subsection end
        end
        if #dto.subsections>0 then result.sections[#result.sections+1]=dto end
      end
    end
    if cellId then
      assert(selected,'The requested calculation cell is not available for this input')
      result.breakdown={cellId=cellId,sections=array()}
      attempt(cellId,function()
        tab.controls.breakdown:SetBreakdownData(selected,true)
        for _,section in ipairs(tab.controls.breakdown.sectionList) do
          local dto={type=section.type,label=section.label and text(section.label),footer=section.footer and text(section.footer)}
          if section.type=='TEXT' then
            dto.lines=array();for _,line in ipairs(section.lines) do dto.lines[#dto.lines+1]=text(line) end
          elseif section.type=='TABLE' then
            dto.columns=array();dto.rows=array()
            for _,column in ipairs(section.colList) do dto.columns[#dto.columns+1]={key=column.key,label=text(column.label)} end
            for _,row in ipairs(section.rowList) do
              local entry={values={}}
              for _,column in ipairs(section.colList) do entry.values[column.key]=text(row[column.key]) end
              if row.mod then entry.source=row.mod.source;entry.sourceSlot=row.mod.sourceSlot end
              dto.rows[#dto.rows+1]=entry
            end
          elseif section.type=='RADIUS' then dto.radius=section.radius
          end
          result.breakdown.sections[#result.breakdown.sections+1]=dto
        end
      end)
    end
    build.viewMode=previousView
    return result
  end
end
