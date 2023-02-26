import bigInt from 'big-integer';
import { EC } from './ec';

const a = bigInt(-3);
const b = bigInt('2455155546008943817740293915197451784769108058161191238065');
const p = bigInt('6277101735386680763835789423207666416083908700390324961279');
const base = bigInt(65536);
const n = bigInt('28186466892849679686038856807396267537577176687436853369');

const str = 'hello world! ! @#$ Nouven!';

const ec = new EC(a, b, p, n);
const Pm = ec.fromDigits(Buffer.from(str));
const cipher = ec.encrypt(ec.generatePoints(Pm));
const plain = ec.decrypt(cipher[0], cipher[1]);
const x = ec.breakPoints(plain);
const y = ec.toDigits(x);
console.log('============>   ', Buffer.from(y).toString());
