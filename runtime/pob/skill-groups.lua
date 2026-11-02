-- Original SkillListControl owns reordering/deletion and both skill selectors.
-- Observe LoadSkill object identity; never match groups by their display names.
return function(editor)
  local function array()return setmetatable({},{__jsontype='array'})end
  return function(request)
    local operation=assert(request.skillGroups,'Skill group operation is required')
    assert(operation.action=='inspect'or operation.action=='reorder'or operation.action=='delete','Unknown skill group operation')
    if not common.classes.SkillsTab then LoadModule('Classes/SkillsTab')end
    local class=common.classes.SkillsTab;local load=class.LoadSkill
    local source,counts={},{}
    class.LoadSkill=function(self,node,id)
      load(self,node,id)
      if node.elem=='Skill'then
        local list=self.skillSets[id].socketGroupList;local key=tostring(id)
        counts[key]=(counts[key]or 0)+1
        source[assert(list[#list],'Original skill load produced no group')]={setId=key,id=tostring(counts[key])}
      end
    end
    local ok,message=pcall(editor.load,request.xml);class.LoadSkill=load;assert(ok,message)
    local tab=build.skillsTab;local setId=tostring(tab.activeSkillSetId)
    assert(setId==operation.setId,'Skill group operation must target the active original set')
    local list=tab.socketGroupList;local expected=assert(request.canonicalSkillGroups,'Canonical skill group inventory is required')
    assert(#list==#expected,'Original restored skill groups differ from canonical XML; explicit generated-group lineage is required')
    local initial,groups={},array()
    for index,value in ipairs(list)do
      local origin=assert(source[value],'Original generated skill group has no canonical XML lineage')
      assert(origin.setId==setId and expected[index]==origin.id,'Original skill group lineage changed during load')
      initial[origin.id]=value
      groups[#groups+1]={id=origin.id,label=StripEscapes(value.displayLabel or value.label or ''),source=value.source,canDelete=not value.source}
    end
    local control=new('SkillListControl',nil,{0,0,350,200},tab)
    local confirmation
    if operation.action~='inspect'then
      local target=assert(initial[operation.groupId],'Original skill group source is unavailable')
      local index=isValueInArray(list,target);control.selIndex=index;control.selValue=target
      if operation.action=='reorder'then
        local position=operation.position
        assert(type(position)=='number'and position==math.floor(position)and list[position],'Original skill group destination is unavailable')
        assert(position~=index,'Original skill group is already at this position')
        control.selDragging=true;control.selDragActive=true;control.selDragIndex=position>index and position+1 or position
        control:OnKeyUp('LEFTBUTTON');assert(list[position]==target,'Original skill group drag did not reach its destination')
      else
        assert(control.controls.delete:IsEnabled(),'Original skill group deletion is disabled')
        local confirm=main.OpenConfirmPopup
        main.OpenConfirmPopup=function(self,title,text,label,callback)confirmation=text;callback()end
        local worked,reason=pcall(control.OnSelDelete,control,index,target);main.OpenConfirmPopup=confirm;assert(worked,reason)
        assert(not isValueInArray(list,target),'Original skill group was not deleted')
      end
    end
    -- Original CalcSetup clamps selectors after deleting the last/only group.
    build.calcsTab:BuildOutput()
    local order=array();for _,value in ipairs(list)do order[#order+1]=assert(source[value],'Original operation introduced an untracked skill group').id end
    return{operation=operation,setId=setId,groups=groups,order=order,mainSocketGroup=build.mainSocketGroup,calcsSkillNumber=build.calcsTab.input.skill_number,confirmation=confirmation}
  end
end
