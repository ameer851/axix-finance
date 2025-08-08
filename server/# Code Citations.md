# Code Citations

## License: unknown

https://github.com/mrf1freak/accounting-react/tree/6e675934b1785cf6b46421ee0f96e6af4edc80a2/src/utils/password.ts

```
);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex"
```

## License: unknown

https://github.com/maulanaadil/Maulnad_porto_BE/tree/97c85934776fa64a6eb8fc7ae371de8c31225f4f/src/helpers/hashPassword.ts

```
hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${
```

## License: unknown

https://github.com/ncrmro/ncrmro-static/tree/e8f6031a06a45d2fcb842e0dca972e1a4b70d723/src/lib/auth.ts

```
: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`
```
