async function readItemSource(page,scope=page){
  const status=scope.locator('.native-item-editor [role=status]').first();
  if(await status.count())for(let attempt=0;attempt<300;attempt++){if((await status.innerText()).includes('자동 반영 준비됨'))break;await page.waitForTimeout(100);}
  await scope.getByRole('button',{name:'편집',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'아이템 원문 편집',exact:true}),text=await dialog.getByLabel('아이템 원문',{exact:true}).inputValue();
  await dialog.getByRole('button',{name:'취소',exact:true}).click();await dialog.waitFor({state:'hidden'});return text;
}
module.exports={readItemSource};
