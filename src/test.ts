import bigInt, { BigInteger } from 'big-integer';
import { isEqual } from 'lodash';
import { EC } from './ec';

interface IPoint {
  x: BigInteger;
  y: BigInteger;
}
interface IKey {
  k: BigInteger;
  a: BigInteger;
  b: BigInteger;
  p: BigInteger;
  G: IPoint;
  Pa: IPoint;
  kd: {
    n: BigInteger;
  };
}

function integerDigits(n: BigInteger, b: BigInteger): any[] {
  const result: any = [];
  const zero = bigInt.zero;
  if (n.eq(zero)) {
    return result;
  }
  while (n.neq(zero)) {
    result.push(n.mod(b));
    n = n.divide(b);
  }
  return result;
}
const k = bigInt(3);
const a = bigInt(-3);
const b = bigInt('2455155546008943817740293915197451784769108058161191238065');
const p = bigInt('6277101735386680763835789423207666416083908700390324961279');
const base = bigInt(65536);
const G: IPoint = {
  x: bigInt(60204628237568865675821348058752611191669876636884684818),
  y: bigInt(174050332293622031404857552280219410364023488927386650641),
};
const O: IPoint = {
  x: bigInt(0),
  y: bigInt(0),
};
const n = bigInt('28186466892849679686038856807396267537577176687436853369');
const Pa = multiplyPoint(G, n, a, b, p);

function fromDigits(buf: Buffer, groupSize: number): BigInteger[] {
  let length = groupSize;
  let bufLength = bigInt(buf.length);
  const result = [];

  for (let i = 0; i < buf.length; i += groupSize) {
    if (bufLength.minus(i).divmod(groupSize).quotient.leq(0)) {
      length = Number(bufLength.divmod(groupSize).remainder);
    }
    let val = bigInt.zero;
    let index = length;
    for (let j = i; j < length + i; j++) {
      index--;
      val = val.plus(base.pow(index).multiply(buf[j]));
    }
    result.push(val);
  }
  return result;
}

function generatePoints(arr: BigInteger[]): IPoint[] {
  const result = [];
  if (arr.length % 2 !== 0) {
    arr.push(bigInt(32));
  }
  for (let i = 0; i < arr.length; i += 2) {
    const point: IPoint = {
      x: arr[i],
      y: arr[i + 1],
    };
    result.push(point);
  }
  return result;
}

function breakPoints(arr: IPoint[]): BigInteger[] {
  const result = [];
  for (const i of arr) {
    result.push(i.x);
    result.push(i.y);
  }
  return result;
}

function toDigits(arr: BigInteger[], groupSize: number) {
  const result = [];
  for (let i of arr) {
    const tempArr = [];
    while (i.divide(base).gt(0)) {
      const temp = i.divmod(base);
      tempArr.push(Number(temp.remainder));
      i = temp.quotient;
    }
    tempArr.push(Number(i));
    result.push(...tempArr.reverse());
  }
  return result;
}

//const arr = [78, 97, 116, 105, 111, 110, 97, 108, 32, 73, 110, 115, 116, 105, 116, 117, 116, 101, 32, 111, 102, 32, 84, 101, 99,]

//const str = 'National Institude of Tec'
//const buf = Buffer.from(str)
//
//const from = fromDigits(buf, 11)
//console.log('============>   from : ', from)
//const to = toDigits(from, 11)
//console.log('============>   to: ', Buffer.from(to).toString())

const P: IPoint = {
  x: bigInt(0),
  y: bigInt(1),
};
//const Q: IPoint = {
//  x: bigInt(0),
//  y: bigInt(0),
//}

function addPoint(
  P: IPoint,
  Q: IPoint,
  a: BigInteger,
  b: BigInteger,
  p: BigInteger
): IPoint {
  if (isEqual(P, O)) {
    return Q;
  }
  if (isEqual(Q, O)) {
    return P;
  }

  let lambda: BigInteger;
  const Z: IPoint = { x: bigInt(0), y: bigInt(0) };
  if (isEqual(P, Q)) {
    lambda = P.x
      .pow(2)
      .multiply(3)
      .plus(a)
      .multiply(P.y.multiply(2).modInv(p))
      .mod(p);
  } else {
    lambda = Q.y.minus(P.y).multiply(Q.x.minus(P.x).modInv(p)).mod(p);
  }
  Z.x = lambda.pow(2).minus(P.x).minus(Q.x).mod(p);
  Z.y = lambda.multiply(P.x.minus(Z.x)).minus(P.y).mod(p);
  if (Z.x.lt(0)) {
    Z.x = Z.x.plus(p);
  }
  if (Z.y.lt(0)) {
    Z.y = Z.y.plus(p);
  }
  return Z;
}
function multiplyPoint(
  P: IPoint,
  n: BigInteger,
  a: BigInteger,
  b: BigInteger,
  p: BigInteger
) {
  let Q = O;
  const arr = n
    .toString(2)
    .split('')
    .reverse()
    .map((i) => Number(i));
  for (const i of arr) {
    if (i === 1) {
      Q = addPoint(Q, P, a, b, p);
    }
    P = addPoint(P, P, a, b, p);
  }
  if (Q.x.lt(0)) {
    Q.x = Q.x.plus(p);
  }
  if (Q.y.lt(0)) {
    Q.y = Q.y.plus(p);
  }
  return Q;
}

//const x = multiplyPoint(P, bigInt(3), bigInt(1), bigInt(4), bigInt(17))
//const x = addPoint(Q, Q, bigInt(1), bigInt(4), bigInt(17))
//console.log('============>   ', x)

function encrypt(Pm: IPoint[], key: IKey): any {
  const temps = [];
  const kG = multiplyPoint(key.G, key.k, key.a, key.b, key.p);
  const kPa = multiplyPoint(key.Pa, key.k, key.a, key.b, key.p);
  for (let i of Pm) {
    let temp = addPoint(i, kPa, key.a, key.b, key.p);
    temps.push(temp);
  }
  return [kG, temps];
}
function decrypt(kG: IPoint, temps: IPoint[], key: IKey) {
  const Pm = [];
  let nAP = multiplyPoint(kG, key.kd.n, a, b, p);
  nAP.y = nAP.y.multiply(-1);
  for (let i of temps) {
    const temp = addPoint(i, nAP, a, b, p);
    Pm.push(temp);
  }
  return Pm;
}

const key: IKey = {
  k: k,
  a: a,
  b: b,
  p: p,
  G: G,
  Pa: Pa,
  kd: {
    n: n,
  },
};

const str = 'hello world! ! @#$ Nouven!';

const ec = new EC(a, b, p, n);
const Pm = ec.fromDigits(Buffer.from(str));
const cipher = ec.encrypt(ec.generatePoints(Pm));
const plain = ec.decrypt(cipher[0], cipher[1]);
const x = ec.breakPoints(plain);
const y = ec.toDigits(x);
console.log('============>   ', Buffer.from(y).toString());
