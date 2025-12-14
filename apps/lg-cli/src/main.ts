import { longTermAgentExample } from "./agents/memory/long-term-agent";

const showAllMessages = (result: { messages: any[] }) => {
  console.log(result.messages.map(msg => msg.content).join("\n\n"));
}

const showLastMessageWithCount = (result: { messages: any[] }) => {
  console.log(result.messages.length);
  console.log(result.messages.at(-1)?.content);
}

const showResult = (result: any) => {
  console.log(JSON.stringify(result, null, 2));
}

async function main() {

  showAllMessages((await longTermAgentExample()));
}

main().catch(console.error);