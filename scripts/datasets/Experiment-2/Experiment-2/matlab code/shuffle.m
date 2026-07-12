function [output, labelOutput] = shuffle(inputSeq, inputLabels, N)

% swap two cards N times
for i = 1:N
    % pick two random cards each time
    r = randi(size(inputSeq,1));
    s = randi(size(inputSeq,1));

    % store one in temporary variables
    tempSeq = inputSeq(r,:);
    tempLabel = inputLabels(r,:);

    % swap 
    inputSeq(r,:) = inputSeq(s,:);
    inputLabels(r,:) = inputLabels(s,:);
    inputSeq(s,:) = tempSeq;
    inputLabels(s,:) = tempLabel;
end

output = inputSeq;
labelOutput = inputLabels;
