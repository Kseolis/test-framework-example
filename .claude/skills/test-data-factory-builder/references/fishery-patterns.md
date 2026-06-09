# Fishery patterns we use

## Sequence

`sequence` increments per-factory call, providing collision-free unique values across a single test process.

```ts
Factory.define<Order>(({ sequence }) => ({ id: `order-${sequence}` }));
```

To reset between worker scopes:

```ts
import { userFactory } from './user.factory';
userFactory.rewindSequence();
```

## Transient params

Use for non-domain modifiers that change the _shape_ of the result without leaking into the type itself.

```ts
Factory.define<User, { admin?: boolean }>(({ transientParams }) => ({
  // ...
  role: transientParams.admin ? 'admin' : 'user',
}));
```

## Associations

For nested entities, prefer `associations`:

```ts
const orderFactory = Factory.define<Order, never, { user?: User }>(({ associations }) => ({
  id: `order-1`,
  user: associations.user ?? userFactory.build(),
}));

orderFactory.build({}, { associations: { user: someUser } });
```

## afterBuild

Use sparingly — only for derived fields that the consumer cannot easily provide.

```ts
Factory.define<Cart>(({ afterBuild }) => {
  afterBuild((cart) => {
    cart.total = cart.items.reduce((s, i) => s + i.price, 0);
  });
  return { id: '...', items: [], total: 0 };
});
```

## What NOT to do

- ❌ Network/DB calls inside `Factory.define`. Use a separate `seed()` helper.
- ❌ Conditional types in transient params (turn into a different factory instead).
- ❌ Inheritance hierarchies (`AdminUserFactory extends UserFactory`). Use overrides + transient.
- ❌ Side-effect ESM imports inside factory files (e.g. configuring globals).
