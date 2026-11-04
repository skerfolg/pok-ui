-- Reads the original controls after PoB has evaluated the submitted XML.
-- Eligibility, defaults, options and skill modes remain native PoB decisions.
return function(editor)
  local function array() return setmetatable({},{__jsontype='array'}) end
  local function scalar(v) local t=type(v);if t=='string' or t=='number' or t=='boolean' then return v end end
  local function label(v) return StripEscapes(v==nil and '' or tostring(v)) end
  return function(xml,current)
    if not current then editor.load(xml);build.calcsTab:BuildOutput()end;build.viewMode='CONFIG';build.configTab:UpdateControls()
    local sections,diagnostics,skills=array(),array(),array()
    local function attempt(field,fn,fallback)
      local ok,value=pcall(fn)
      if ok then return value end
      diagnostics[#diagnostics+1]={code='inspection-unavailable',field=field,message=tostring(value)};return fallback
    end
    local section,sectionIndex,fieldIndex=nil,0,0
    for _,var in ipairs(LoadModule('Modules/ConfigOptions')) do
      if var.section then
        sectionIndex=sectionIndex+1;fieldIndex=0;section={name=label(var.section),fields=array()};sections[#sections+1]=section
      else
        fieldIndex=fieldIndex+1
        local control=build.configTab.sectionList[sectionIndex].varControlList[fieldIndex]
        local key=var.var or ('label:'..sectionIndex..':'..fieldIndex)
        local cfg=build.configTab
        cfg.toggleConfigs=false;local available=attempt(key,function()return not not control:IsShown()end,false)
        cfg.toggleConfigs=true;local showAll=attempt(key,function()return not not control:IsShown()end,false);cfg.toggleConfigs=false
        local options=array()
        for _,entry in ipairs(control.list or var.list or {}) do
          if type(entry)=='table' and scalar(entry.val)~=nil then options[#options+1]={label=label(entry.label or entry.val),value=entry.val} end
        end
        local tooltip=attempt(key,function()return control:GetProperty('tooltipText')end,nil)
        if control.tooltipFunc then
          local lines={};local collector={Clear=function()end,AddLine=function(self,height,text)if type(text)=='string' then lines[#lines+1]=text end end}
          attempt(key,function()control.tooltipFunc(collector,'BODY',control.selIndex,control.list and control.list[control.selIndex]);return true end,false)
          if #lines>0 then tooltip=(tooltip and tooltip..'\n' or '')..table.concat(lines,'\n') end
        end
        local kind,value=var.type or 'label',var.var and scalar(cfg.input[var.var])
        local checked;if kind=='check' then checked=not not cfg.input[var.var] end
        section.fields[#section.fields+1]={id=tostring(sectionIndex)..':'..fieldIndex,key=var.var,type=kind,label=label(var.label or var.text or var.var),
          available=available,showAll=showAll,enabled=attempt(key,function()return not not control:IsEnabled()end,true),
          value=value,checked=checked,defaultValue=var.var and scalar(cfg:GetDefaultState(var.var)),
          placeholder=var.var and scalar(cfg.placeholder[var.var]),options=options,tooltip=type(tooltip)=='string' and label(tooltip) or nil}
      end
    end
    build.viewMode='SKILLS'
    for index,group in ipairs(build.skillsTab.socketGroupList) do
      local result={groupId=tostring(index),activeSkill=group.mainActiveSkill or 1,skills=array(),modes=array(),parts=array(),gems=array(),selectedMode=1,selectedPart=1}
      for gemIndex,gem in ipairs(group.gemList) do result.gems[#result.gems+1]={index=gemIndex,name=gem.nameSpec,error=gem.errMsg,level=gem.level,quality=gem.quality} end
      attempt('skill-group:'..index,function()
        build:RefreshSkillSelectControls(build.controls,index,'')
        local controls=build.controls
        for i,entry in ipairs(controls.mainSkill.list) do result.skills[#result.skills+1]={index=i,label=label(entry.label)} end
        local active=group.displaySkillList and group.displaySkillList[result.activeSkill]
        local effect=active and active.activeEffect
        if effect then
          result.grantedEffectId=effect.grantedEffect.id
          for i,gem in ipairs(group.gemList) do if gem==effect.srcInstance then result.sourceGemIndex=i end end
          for i,entry in ipairs(controls.statSet.list) do result.modes[#result.modes+1]={index=i,label=label(entry.label),grantedEffectId=entry.grantedEffectId} end
          result.selectedMode=controls.statSet.selIndex or 1
          if controls.mainSkillPart:IsShown() then
            for i,entry in ipairs(controls.mainSkillPart.list) do result.parts[#result.parts+1]={index=i,label=label(entry.label)} end
            result.selectedPart=controls.mainSkillPart.selIndex or 1
          end
          if controls.mainSkillStageCount:IsShown() then result.stages=tonumber(controls.mainSkillStageCount.buf) end
          if controls.mainSkillMineCount:IsShown() then result.minesAvailable=true;result.mines=tonumber(controls.mainSkillMineCount.buf) end
        end
        return true
      end,false)
      skills[#skills+1]=result
    end
    return{character={className=build.spec.curClassName,ascendancy=build.spec.curAscendClassName or '',level=build.characterLevel,levelAuto=not not build.characterLevelAutoMode},config=sections,skills=skills,diagnostics=diagnostics}
  end
end
