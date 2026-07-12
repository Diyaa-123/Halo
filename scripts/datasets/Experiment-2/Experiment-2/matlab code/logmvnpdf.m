function logpdf = logmvnpdf (x, mu, K)

n = length (x);

R = chol (K);

const = 0.5 * n * log (2 * pi);
term1 = 0.5 * sum (((R') \ (transpose(x  - mu))) .^ 2);
term2 = sum (log (diag (R)));

logpdf = - (const + term1 + term2);

end