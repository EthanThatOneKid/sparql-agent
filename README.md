# SPARQL Agent

Everything you need to build a grounded world model.

```sh
> deno task start
Task start deno -A --env --unstable-raw-imports main.ts
> What is both of our names?
🛠️ query_sparql {
  input: {
    query: "\n" +
      "PREFIX schema: <https://schema.org/>\n" +
      "\n" +
      "SELECT ?user_name ?assistant_name\n" +
      "WHERE {\n" +
      "  <https://id.etok.me/> schema:name ?user_name .\n" +
      "  <https://id.etok.me/assistant> schema:name ?assistant_name .\n" +
      "}\n"
  },
  output: {
    result: [
      {
        user_name: Literal { id: '"Ethan"' },
        assistant_name: Literal { id: '"Computer"' }
      }
    ]
  }
}
Your name is Ethan and my name is Computer.
```

## Developing

Once you've cloned the project, start the application:

```bash
deno task start
```

Run the following command to run the opinionated pre-commit tasks:

```bash
deno task precommit
```

## Deploying

To deploy your application, see
[Deno Deploy](https://docs.deno.com/deploy/manual/).

---

Created with 🧪 [**@FartLabs**](https://github.com/FartLabs)
