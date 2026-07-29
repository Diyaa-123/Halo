function [pcaComponents] = PCAcomponents(Output)

pcaComponents = [];
[coeff, pcaData,latend, tsd,varience]=pca(Output);

pcaComponents = pcaData(:,1:2);

end