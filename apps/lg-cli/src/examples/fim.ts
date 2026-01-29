
export async function fimExample() {
  const modelName = 'codellama:7b-code';
  const resp = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: modelName,
      prompt: `<PRE> console.log("hello <SUF>"); <MID>`,
      stream: false,
      options: {
        temperature: 0,
        stop: ["<EOT>", "\n", "\""],
      },
    }),
  });

  return await resp.json();
}