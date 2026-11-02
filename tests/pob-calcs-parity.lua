-- Test-only reference: original headless first-frame result, without UI adapters.
package.path='./?.lua;../runtime/lua/?.lua;../runtime/lua/?/init.lua;'..package.path
package.cpath='../runtime/?.dll;../runtime/?.so;'..package.cpath
local json=require('dkjson')
local stdout,open=io.stdout,io.open
print=function(...)for i=1,select('#',...)do io.stderr:write(tostring(select(i,...)),' ')end;io.stderr:write('\n')end
local sink={write=function(self)return self end,close=function()end,flush=function()end}
io.open=function(name,mode)
  if (mode or 'r'):find('[wa+]')then return sink end
  if tostring(name):match('[Ss]ettings%.xml$')then return nil end
  return open(name,mode)
end
os.execute=function()error('disabled in parity test')end
local input=json.decode(io.read('*a'))
io.read=function()error('unexpected interactive prompt')end
dofile('HeadlessWrapper.lua')
loadBuildFromXML(input.xml,'Synthetic parity')
local lines=setmetatable({},{__jsontype='array'})
for _,line in ipairs(build.calcsTab.calcsEnv.player.breakdown.Life)do lines[#lines+1]=StripEscapes(line)end
stdout:write(json.encode({life=build.calcsTab.calcsOutput.Life,lines=lines}),'\n')
