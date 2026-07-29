%%Partial state of optimization with some improved results
% tic
function [Prediction,timeElapsed_AlgoExec_Naive] = Naive_Bayes_edit(Data_Train,Data_Test,Labels_Train,Labels_Test)
% converting cell arrays of training set to matrix
Data_Train = cell2mat(Data_Train);
% converting cell arrays of testing set to matrix
Data_Test = cell2mat(Data_Test);
% creating the naive bayes network
prior =[0.25,0.25,0.25,0.25]
mdl = fitcnb(Data_Train,Labels_Train,'Prior',prior,'OptimizeHyperparameters','auto',...
    'HyperparameterOptimizationOptions',struct('AcquisitionFunctionName',...
    'expected-improvement-plus'));

%% Test and plot
CVMdl1 = fitcnb(Data_Train,Labels_Train,'CrossVal','on');
% Estimate the cross-validation error for both models using 10-fold cross-validation.
defaultCVmdl = crossval(mdl);
defaultLoss = kfoldLoss(defaultCVmdl)
% Create a default naive Bayes binary classifier template, and train an error-correcting, output codes multiclass model.
t = templateNaiveBayes();
CVMdl2 = fitcecoc(Data_Train,Labels_Train,'CrossVal','on','Learners',t);
% Compare the out-of-sample k-fold classification error (proportion of misclassified observations).
classErr1 = kfoldLoss(CVMdl1,'LossFun','classiferror')
classErr2 = kfoldLoss(CVMdl2,'LossFun','ClassifErr')

%%
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