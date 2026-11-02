-- Test-only original NotesTab reference. All writes/settings/process calls are blocked.
package.path='./?.lua;../runtime/lua/?.lua;../runtime/lua/?/init.lua;'..package.path
package.cpath='../runtime/?.dll;../runtime/?.so;'..package.cpath
local json=require('dkjson');local stdout,open=io.stdout,io.open
print=function(...)for i=1,select('#',...)do io.stderr:write(tostring(select(i,...)),' ')end;io.stderr:write('\n')end
local sink={write=function(self)return self end,close=function()end,flush=function()end}
io.open=function(name,mode)if(mode or'r'):find('[wa+]')then return sink end;if tostring(name):match('[Ss]ettings%.xml$')then return nil end;return open(name,mode)end
os.execute=function()error('disabled in notes parity')end;os.remove=function()return nil end;os.rename=function()return nil end
local cases=json.decode(io.read('*a'));io.read=function()error('unexpected prompt')end;dofile('HeadlessWrapper.lua');newBuild()
local notes=build.notesTab;notes.width=800;notes.height=600;local result=setmetatable({},{__jsontype='array'})
for _,case in ipairs(cases)do notes.showColorCodes=false;notes.controls.edit.buf=case.text;notes.controls.edit.sel=case.start+1;notes.controls.edit.caret=case.finish+1;notes:SetColor(case.code);result[#result+1]=notes.controls.edit.buf end
local presets={};for _,key in ipairs({'NORMAL','MAGIC','RARE','UNIQUE','FIRE','COLD','LIGHTNING','CHAOS','STRENGTH','DEXTERITY','INTELLIGENCE'})do presets[key]=colorCodes[key]end;presets.DEFAULT='^7'
stdout:write(json.encode({texts=result,presets=presets}),'\n')
