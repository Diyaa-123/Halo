% tic
function [Prediction,timeElapsed_AlgoExec_Naive] = Naive_Bayes(Data_Train,Data_Test,Labels_Train,Labels_Test)
% converting cell arrays of training set to matrix
Data_Train = cell2mat(Data_Train);
% converting cell arrays of testing set to matrix
Data_Test = cell2mat(Data_Test);
% creating the naive bayes network
mdl = fitcnb(Data_Train,Labels_Train);

% predicting the class    
Prediction = predict(mdl,Data_Test);

% computing the confusion matrix and visualizing it
figure

NB = confusionchart(Labels_Test,Prediction);
NB.Title = 'NaiveBayes'
NB.RowSummary = 'row-normalized';
NB.ColumnSummary = 'column-normalized';
% timeElapsed_AlgoExec_Naive = toc/60;
% plotPartialDependence(mdl,1)
% view(mdl,'Mode','graph')
end