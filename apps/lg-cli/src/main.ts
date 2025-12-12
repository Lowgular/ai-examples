import { getUserName } from "./agents/get-name";

async function main() {

  return await getUserName();
}

main().then(res => {
  console.log(res);
  console.log(res.messages.length);

}).catch(console.error);
