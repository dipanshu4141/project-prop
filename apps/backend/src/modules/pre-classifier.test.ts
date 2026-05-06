import { PreClassifierService } from './messages/pre-classifier.service';

const svc = new PreClassifierService();

// Should be HIGH (all 4 signals)
console.log(svc.classify('2BHK for rent in Andheri West, fully furnished, 45k, contact 9876543210'));

// Should be MEDIUM (3 signals — no phone)
console.log(svc.classify('2BHK for rent in Andheri West, 45k, semi furnished'));

// Should be LOW (noise)
console.log(svc.classify('Good morning everyone 🙏'));

// Should be LOW (too short)
console.log(svc.classify('hi'));

// Price formats
console.log(svc.classify('3BHK sale Bandra 1.2cr contact 9823456789').extracted.price); // 12000000
console.log(svc.classify('1BHK rent Powai 35to40k 9812345678').extracted.price);        // 40000
console.log(svc.classify('₹75,000 2BHK Worli furnished 9812345678').extracted.price);   // 75000

// Fuzzy furnishing
console.log(svc.classify('2BHK Malad West farnished 40k 9812345678').extracted.furnishing); // FURNISHED