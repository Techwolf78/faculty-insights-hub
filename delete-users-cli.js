#!/usr/bin/env node

// delete-users-cli.js
const { execSync } = require('child_process');

// Hardcoded list of UIDs to delete from Auth (excluding the protected superAdmin)
const uidsToDelete = [
  '95N1WG6RKGeLfn4AOb23zN8FTiW2', // prashant.dubey@indiraigsb.edu.in
  'qmdyADPXDSMiL9lCE8wekfn6xMT2', // neelesh.atre@indiraigsb.edu.in
  'M1VK7TmQ3qakvj84zskSUedIXuH2', // anuradha.phadnis@indiraigsb.edu.in
  'Jb7v6sPs7Lb5XsNtxpwTagoKx4v1', // aatish.zagade@indiraigsb.edu.in
  'A7QzXGCZrnSRDeJmYVc8WqZBtSh1', // priyanka.darekar@indiraigsb.edu.in
  'mYCwtcQxy4XXGhrggTUpqUHzE4I2', // jayant.joshi@indiraigsb.edu.in
  'Vj5f8puOfiPgFDHLQjomNbfOQ9J3', // mahesh.bhagat@indiraigsb.edu.in
  '7s9Br23h71SgI770ZuZhFNeAzfk2', // aniruddha.thuse@indiraigsb.edu.in
  'JpBwpjzLkERk5lFy19w2Ie5gcrg1', // poonam.wani@indiraicem.ac.in
  'NfPvp8gfqDeJ403fkMf2vttYKLv2', // ashish.vyas@indiraigsb.edu.in
  'qU40bsO6YfQ8HS84oJ7FkLlEswD2', // girija.shirurkar@indiraigsb.edu.in
  'W5nLV56UZOfH32YYlyowZUitI723', // neha.chaudhry@indiraigsb.edu.in
  'SVk6T0sUH9gV7wVcSrmPWExItms2', // chhaya.bodkurwar@indiraigsb.edu.in
  'tGghk3zUHgXk6nDRiB9ORcxomVs2', // siddhi.dhoble@indiraigsb.edu.in
  'yzQBZNHHHKWWOzwTC7ywSnVK32N2', // snehal.masurkar@indiraigsb.edu.in
  'lUV0SPHPvyVZ5KKSkRhValmLXE42', // amol.ankush@indiraigsb.edu.in
  'fZYg1zyC6eQTSvfnXOzgl7FxBHr1', // dean.igsb@indiraigsb.edu.in
  'YASBRBCZQkYMmLwSkPAQLtXU43a2', // kiran.devade@indiraicem.ac.in
  'dPdBQeU8bKY2Yv9DDbN8a4zv73K2', // aditee.huparikar@indiraicem.ac.in
  'uP0whWNFfaWJgbAOj27gOQVt02f2', // priyanka.shinde@indiraicem.ac.in
  'C4GdCBMiGYd1emB9sThbQFHHHB62', // rupali.salunke@indiraicem.ac.in
  'vxGvMljmrldgvaMoy6S17H4qQ0l1', // poornashankar@indiraicem.ac.in
  'uUrkWYPG5bURujYvZnK5xyllbbe2', // bhushan.nikam@indiraicem.ac.in
  'xwD2Xyj7RPYfEmQILkiKiGXgjly1', // avinash.bansode@indiraicem.ac.in
  '3JQtmyalQPVtzJzUkleh63ULKRM2', // pratima.uploankar@indiraicem.ac.in
  '4Z5bJRuMK3dxivhR3DoOSUKSncD3', // raghunandan.kale@indiraicem.ac.in
  '4eg09clquBVLyNUEV2ml1cE7XUk2', // meenakshi.madgunaki@indiraicem.ac.in
  'K5sDNy08WThdK7vUhyenZz27tAz2', // deepali.dagale@indiraicem.ac.in
  'SkVJRJll1Xc0OX47jFz8sfDQTF52', // pravin.charde@indiraicem.ac.in
  'OCYKr6lCtPhX3NSXpBJqc5Qy3qs1', // dipali.junankar@indiraicem.ac.in
  'dxYUBrCfviVbDh2keJlXaTpTD0q2', // hemant.darokar@indiraicem.ac.in
  '3ZsAfZrimCPfxNwgsXuGsOdKwRp1', // sagar.chirade@indiraicem.ac.in
  'QgnEobJCjnepaZ4SIQvqtwLpF1E2', // sushil.chopade@indiraicem.ac.in
  'O6HbO7fBlRTUR2RODdyO3kGgxl12', // malayaj.kumar@indiraicem.ac.in
  'MpNbPpMJsvZpEUELttzieYlSFug1', // manishankar.pandey@indiraicem.ac.in
  '41co75cT5yY4xt48v0ZJ9jI9SHO2', // mrunal.vaidya@indiraicem.ac.in
  '7NqwvJcnelRyEEnQ2Njpe3yhUIo1', // anita.patil@indiraicem.ac.in
  'emLoNkI3ZmTi4XHFNPiGEDldvrh2', // savitri.pawar@indiraicem.ac.in
  'mSzqNcMz1RXqYXvqoYJ6SFPr4Ae2', // patil.minal@indiraicem.ac.in
  'q4MOMrxykddY4wREM1vMJraCeZl1', // savita.jangale@indiraicem.ac.in
  'TwmW4iEaBrP1STrqd2Z5xwtG6Cs2', // rupali.adhau@indiraicem.ac.in
  '7epMUvPwwGNdayp3rVmwrg8qYv83', // soumitra.das@indiraicem.ac.in
  '84bNN95122bCbjmXA6053seFcLv2', // sunil.rathod@indiraicem.ac.in
  'UC65fuqX4uWihcJIszDkQsVyKmv1', // ashwini.gaikwad@indiraicem.ac.in
  '99lqoPZhVPTNQ1OBJ6FaBwoQMDh2', // prakash.bhusari@indiraicem.ac.in
  'wQmUI8Q4QKhoXWqEWK1NXrUX9bi2', // deepa.padwal@indiraicem.ac.in
  'GW23dcizRNPILwnzdn8jVEnPajg2', // vidya.dhoke@indiraicem.ac.in
  'eUronzXxnXeFyk9MlaIkra9McR93', // pranali.khatake@indiraicem.ac.in
  'uvPsYsT5IZV8JniC07l8qQLOgrB2', // shreya.shenai@indiraicem.ac.in
  'TpHapWKaQaPMJf8CJaQ1tZPUvME3', // amit.narwade@indiraicem.ac.in
  'SHzwXSS60fQlvUK0ZJsqXPzTYgm2', // vikas.nandgaonkar@indiraicem.ac.in
  'f9qvlGIPoWgsYiOMotf8YvZK3jk2', // supriya.kumbhar@indiraicem.ac.in
  'F8hN9CVqRkbJX1k5Hmk0lOBCzNG3', // desai.darshana@indiraicem.ac.in
  'GRvJK25p4JhXlou6Cu3hcyfzgLl1', // shubhangi.kamble@indiraicem.ac.in
  'ouSMKUqeJddznsz1yHOdk4XTUZH2', // ashwini.admane@indiraicem.ac.in
  'hxRW8hLBYadXptp2EdXy6ZK5CZR2', // vishal.meshram@indiraicem.ac.in
  '1dINeMX5cXP6L07IGZzpy9DYqJj2', // shreyas.satpute@indiraicem.ac.in
  'kGINuAlWNmTmfgZXkgU5yLlb6cg2', // monika.patil@indiraicem.ac.in
  'DI05ecYcSiZnP6oSB88rhaQCHvf1', // sanjay.mathapati@indiraicem.ac.in
  'ZQxY8SjzHSXVeiA6EKazdcLnKD72', // awantika.bijwe@indiraicem.ac.in
  'OkkLjP33vVUhL4Dv8ppYM383saW2', // archana.salve@indiraicem.ac.in
  'k7Ahyj49kggWvAfMaSFSdpcEF6l1', // mandakini.dahiwade@indiraicem.ac.in
  '66BR1DkXHmXeLOksZeGNAYSAV4l2', // dayanand.kamble@indiraicem.ac.in
  'g99o48mxGMdH1HFQb7LZP1TBYxi1', // d.bhagwat@indiraicem.ac.in
  'BUqucvoO6OYg94d4xXBM4ICzi3p1', // saurabhgupta@indiraicem.ac.in
  'jZc7pEHiMSNCgv5lkEKnfvNKF942', // manjusha.tomar@indiraicem.ac.in
  'o10TGAh6L0S825gtLLYx07WJ1812', // swapnil.chaudhari@indiraicem.ac.in
  'xmFQqVFfQwNhV6H46u575ZpnqBf2', // athod.shubham@indiraicem.ac.in
  'hYv5QVOuzAevHyuVCRzkQWXMJ7q1', // manjusha.tatiya@indiraicem.ac.in
  '3rwiDbmW01QzFviDtFhnD0CiAwz1', // priyanka.mahajan@indiraicem.ac.in
  'O4NshtQR1SObQs8CTOYQkmpWgTH3', // pravin.thorat@indiraicem.ac.in
  '87Ay3EDSuGPOx4hfjyJtNa9wz5C3', // trupti.kathale@indiraicem.ac.in
  'gDBtFw1wVrYQLh6BFQpMYhTU1Jr2', // priyanka.pawar@indiraicem.ac.in
  'OXsqfvl9Y5RtsCWqQ3tqVVSZ6et2', // nazir.nazari@indiraicem.ac.in
  '4XSnKO4iIwY2ancaEkrMeQjeFbF2', // ajay@gryphonacademy.co.in
  'Us96bAv2ZiOlRJWvp8VPYxvrGvv1', // admin@igsb.edu
  'qEk8MhKlbfcGIMAb1PS1ThgKT0X2'  // admin@icem.edu
];

console.log('🚨 DANGER: This script will delete all hardcoded users from Firebase Auth!');
console.log('🚨 Make sure you have backups and understand the consequences.');
console.log(`📊 Found ${uidsToDelete.length} users to delete from Auth.`);

let deletedCount = 0;
let errorCount = 0;

for (const uid of uidsToDelete) {
  try {
    console.log(`🗑️ Deleting user: ${uid}`);
    execSync(`firebase auth:delete ${uid} --project faculty-feedback-c51ae --token $(gcloud auth print-access-token)`, { stdio: 'inherit' });
    console.log(`✅ Deleted user: ${uid}`);
    deletedCount++;
  } catch (error) {
    console.error(`❌ Failed to delete user ${uid}:`, error.message);
    errorCount++;
  }
}

console.log(`\n📊 Deletion Summary:`);
console.log(`   Successfully deleted: ${deletedCount} users`);
console.log(`   Errors: ${errorCount} users`);

if (errorCount > 0) {
  console.log('⚠️  Some deletions failed. Check the errors above.');
} else {
  console.log('🎉 All deletions completed successfully!');
}