var mystery_token = 100;
for (var i = 11; i < mystery_token && mystery_token < i*i*i; i++) {
	mystery_token *= i - 3;
	mystery_token += 56;
}
mystery_token *= 1337;
mystery_token <<= 9;
mystery_token = mystery_token.toString(16).replace(/0/g, 'Y').replace(/9/g, 'st');
