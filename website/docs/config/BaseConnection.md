---
id: baseconnection
title: BaseConnection
toplevel: true
---

Note: this document is automatically generated from configuration objects in
our source code. See [Config guide](/docs/config_guide) for more info

## Docs

### BaseConnection - Identifier

#### slot: explicitIdentifier

### BaseConnection - Slots

#### slot: name

```js
name: {
      type: 'string',
      defaultValue: 'nameOfConnection',
      description: 'a unique name for this connection',
    }
```

#### slot: assemblyNames

```js
assemblyNames: {
      type: 'stringArray',
      defaultValue: [],
      description: 'optional list of names of assemblies in this connection',
    }
```