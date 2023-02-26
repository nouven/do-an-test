import bigInt from 'big-integer'


export class RSA {
  public constructor() { }

  private randomPrime(bits: number) {
    const min = bigInt.one.shiftLeft(bits - 1);
    const max = bigInt.one.shiftLeft(bits).prev();

    while (true) {
      let p = bigInt.randBetween(min, max);
      if (p.isProbablePrime(256)) {
        return p;
      }
    }
  }
  public generateKey(keysize: number) {
    const e = bigInt(65537);
    let p;
    let q;
    let totient;

    do {
      p = this.randomPrime(keysize / 2);
      q = this.randomPrime(keysize / 2);
      totient = bigInt.lcm(
        p.prev(),
        q.prev()
      );
    } while (bigInt.gcd(e, totient).notEquals(1) || p.minus(q).abs().shiftRight(keysize / 2 - 100).isZero());

    return {
      e,
      n: p.multiply(q),
      d: e.modInv(totient),
    };
  }

  public encrypt(encodedMsg: any, n: any, e: any) {
    return bigInt(encodedMsg).modPow(e, n);
  }

  public decrypt(encryptedMsg: any, d: any, n: any) {
    return bigInt(encryptedMsg).modPow(d, n);
  }

  public encode(str: string) {
    const codes: string = str
      .split('')
      .map(i => i.charCodeAt(0))
      .join('');

    return bigInt(codes);
  }

  public decode(code: string) {
    const stringified = code.toString();
    let string = '';

    for (let i = 0; i < stringified.length; i += 2) {
      let num = Number(stringified.substr(i, 2));

      if (num <= 30) {
        string += String.fromCharCode(Number(stringified.substr(i, 3)));
        i++;
      } else {
        string += String.fromCharCode(num);
      }
    }

    return string;
  }
}



