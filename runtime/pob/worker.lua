-- Protocol adapter for upstream Path of Building's MIT HeadlessWrapper.lua.
-- All game calculations remain in the unmodified upstream PoB runtime.
local stdout, stderr, open = io.stdout, io.stderr, io.open
package.path = './?.lua;../runtime/lua/?.lua;../runtime/lua/?/init.lua;' .. package.path
package.cpath = '../runtime/?.dll;../runtime/?.so;' .. package.cpath
local json = require('dkjson')
local function reply(value)
  stdout:write(assert(json.encode(value)), '\n'); stdout:flush()
end
print = function(...)
  local values = {}
  for i=1,select('#',...) do values[i]=tostring(select(i,...)) end
  stderr:write(table.concat(values, ' '), '\n'); stderr:flush()
end
-- The host owns all persistence. Upstream settings/build autosaves cannot write
-- into the installation or the user's original PoB profile.
local sink = {write=function(self) return self end, close=function() return true end, flush=function() end}
io.open = function(name, mode)
  if (mode or 'r'):find('[wa+]') then return sink end
  if tostring(name):match('[Ss]ettings%.xml$') then return nil end
  return open(name, mode)
end
os.execute = function() error('Process execution is disabled in the PoB worker') end
os.remove = function() return nil end
os.rename = function() return nil end
io.popen = function() error('Process execution is disabled in the PoB worker') end
io.read = function() error('Unexpected interactive prompt from upstream PoB') end
local ok, err = pcall(dofile, 'HeadlessWrapper.lua')
if not ok then reply({id=0,ok=false,error={code='POB_START',message=tostring(err)}}); os.exit(1) end
local adapter=(arg[0]:match('^(.*[/\\])') or '')
local editor=dofile(adapter..'editor.lua')
local inspect=dofile(adapter..'inspect.lua')(editor)
local calcs=dofile(adapter..'calcs.lua')(editor)
local party=dofile(adapter..'party.lua')(editor)
local treeState=dofile(adapter..'tree-state.lua')
local tree=dofile(adapter..'tree.lua')(editor,treeState)
local equipment=dofile(adapter..'equipment.lua')(editor)
local loadouts=dofile(adapter..'loadouts.lua')(editor,dofile(adapter..'loadout-management.lua'),dofile(adapter..'tree-workspace.lua')(treeState),dofile(adapter..'skill-groups.lua')(editor,dofile(adapter..'skill-text.lua')))
local itemControls=dofile(adapter..'item-controls.lua')(editor,dofile(adapter..'item-popups.lua'))
reply({id=0,ok=true,result={version=launch.versionNumber,treeVersions=treeVersionList}})
for line in io.stdin:lines() do
  local request, _, decodeError = json.decode(line,1,json.null)
  if type(request)~='table' then
    reply({id=json.null,ok=false,error={code='BAD_REQUEST',message=tostring(decodeError)}})
  else
    local worked, result = pcall(function()
      if request.op=='catalog' then return editor.catalog() end
      if request.op=='tree-source' then return editor.treeSource(request.version) end
      if request.op=='item' then return editor.item(request.args) end
      if request.op=='inspect' then return inspect(request.xml) end
      if request.op=='calcs' then return calcs(request.xml,request.cellId) end
      if request.op=='party' then return party(request) end
      if request.op=='tree' then return tree(request) end
      if request.op=='equipment' then return equipment(request) end
      if request.op=='loadouts' then return loadouts(request) end
      if request.op=='item-controls' then return itemControls(request) end
      if request.op~='compute' then error('Unsupported operation: '..tostring(request.op)) end
      assert(type(request.xml)=='string','XML is required')
      editor.load(request.xml)
      assert(build and build.targetVersion,'PoB requires build conversion')
      build.calcsTab:BuildOutput()
      local stats={}
      for key,value in pairs(build.calcsTab.mainOutput or {}) do
        if type(value)=='number' and value==value and value~=math.huge and value~=-math.huge then stats[key]=value end
      end
      local warnings={}
      for _,value in ipairs(build.controls.warnings and build.controls.warnings.lines or {}) do
        if type(value)=='string' then warnings[#warnings+1]=value end
      end
      return {ok=true,stats=stats,warnings=warnings,version=launch.versionNumber,treeVersion=build.spec.treeVersion}
    end)
    if worked then reply({id=request.id,ok=true,result=result})
    else reply({id=request.id,ok=false,error={code=request.op=='compute' and 'POB_COMPUTE' or 'POB_EDITOR',message=tostring(result)}}) end
  end
end
