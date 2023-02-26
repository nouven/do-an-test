import bigInt, { BigInteger } from 'big-integer';
import { isEqual } from 'lodash';
import { IPoint } from './interface';

export class EC {
  private Pa: IPoint;
  private k: BigInteger;
  private a: BigInteger;
  private b: BigInteger;
  private p: BigInteger;
  private n: BigInteger;
  private groupSize: number;

  private G: IPoint = {
    x: bigInt(60204628237568865675821348058752611191669876636884684818),
    y: bigInt(174050332293622031404857552280219410364023488927386650641),
  };
  private O: IPoint = {
    x: bigInt(0),
    y: bigInt(0),
  };
  private base = bigInt(65536);

  constructor(a: BigInteger, b: BigInteger, p: BigInteger, n: BigInteger) {
    this.a = a;
    this.b = b;
    this.p = p;
    this.k = bigInt(3);
    this.n = n;
    this.Pa = this.multiplyPoint(this.G);
    this.groupSize = this.integerDigits();
  }

  public integerDigits(): number {
    const result: any = [];
    const zero = bigInt.zero;
    if (this.n.eq(zero)) {
      return result;
    }
    while (this.n.neq(zero)) {
      result.push(this.n.mod(this.base));
      this.n = this.n.divide(this.base);
    }
    return result.length - 1;
  }

  public fromDigits(buf: Buffer): BigInteger[] {
    let length = this.groupSize;
    let bufLength = bigInt(buf.length);
    const result = [];
    for (let i = 0; i < buf.length; i += this.groupSize) {
      if (bufLength.minus(i).divmod(this.groupSize).quotient.leq(0)) {
        length = Number(bufLength.divmod(this.groupSize).remainder);
      }
      let val = bigInt.zero;
      let index = length;
      for (let j = i; j < length + i; j++) {
        index--;
        val = val.plus(this.base.pow(index).multiply(buf[j]));
      }
      result.push(val);
    }
    if (result.length % 2 !== 0) {
      result.push(bigInt(32));
    }
    return result;
  }

  public generatePoints(arr: BigInteger[]): IPoint[] {
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

  public breakPoints(arr: IPoint[]): BigInteger[] {
    const result = [];
    for (const i of arr) {
      result.push(i.x);
      result.push(i.y);
    }
    return result;
  }

  public toDigits(arr: BigInteger[]) {
    const result = [];
    for (let i of arr) {
      const tempArr = [];
      while (i.divide(this.base).gt(0)) {
        const temp = i.divmod(this.base);
        tempArr.push(Number(temp.remainder));
        i = temp.quotient;
      }
      tempArr.push(Number(i));
      result.push(...tempArr.reverse());
    }
    return result;
  }

  public addPoint(P: IPoint, Q: IPoint): IPoint {
    if (isEqual(P, this.O)) {
      return Q;
    }
    if (isEqual(Q, this.O)) {
      return P;
    }

    let lambda: BigInteger;
    const Z: IPoint = { x: bigInt(0), y: bigInt(0) };
    if (isEqual(P, Q)) {
      lambda = P.x
        .pow(2)
        .multiply(3)
        .plus(this.a)
        .multiply(P.y.multiply(2).modInv(this.p))
        .mod(this.p);
    } else {
      lambda = Q.y
        .minus(P.y)
        .multiply(Q.x.minus(P.x).modInv(this.p))
        .mod(this.p);
    }
    Z.x = lambda.pow(2).minus(P.x).minus(Q.x).mod(this.p);
    Z.y = lambda.multiply(P.x.minus(Z.x)).minus(P.y).mod(this.p);
    if (Z.x.lt(0)) {
      Z.x = Z.x.plus(this.p);
    }
    if (Z.y.lt(0)) {
      Z.y = Z.y.plus(this.p);
    }
    return Z;
  }
  public multiplyPoint(P: IPoint) {
    let Q = this.O;
    const arr = this.n
      .toString(2)
      .split('')
      .reverse()
      .map((i) => Number(i));
    for (const i of arr) {
      if (i === 1) {
        Q = this.addPoint(Q, P);
      }
      P = this.addPoint(P, P);
    }
    if (Q.x.lt(0)) {
      Q.x = Q.x.plus(this.p);
    }
    if (Q.y.lt(0)) {
      Q.y = Q.y.plus(this.p);
    }
    return Q;
  }

  public encrypt(Pm: IPoint[]): any {
    const temps = [];
    const kG = this.multiplyPoint(this.G);
    const kPa = this.multiplyPoint(this.Pa);
    for (let i of Pm) {
      let temp = this.addPoint(i, kPa);
      temps.push(temp);
    }
    return [kG, temps];
  }
  public decrypt(kG: IPoint, temps: IPoint[]) {
    const Pm = [];
    let nAP = this.multiplyPoint(kG);
    nAP.y = nAP.y.multiply(-1);
    for (let i of temps) {
      const temp = this.addPoint(i, nAP);
      Pm.push(temp);
    }
    return Pm;
  }
  public getPrivateKey() {
    return {
      a: this.a,
      b: this.b,
      p: this.p,
      n: this.n,
    };
  }
  public getPublicKey() {
    return {
      a: this.a,
      b: this.b,
      p: this.p,
      Pa: this.Pa,
    };
  }
}
