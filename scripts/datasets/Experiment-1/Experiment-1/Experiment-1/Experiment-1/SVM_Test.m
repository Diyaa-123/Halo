%% This run the Algo SVM, with Random dividing the test and train data  set the percentage variable PD "Final File"
function [SVM, timeElapsed_TestData_prep_SVM, timeElapsed_AlgoExec_SVM, Data_Test_SVM,Labels_Test_SVM ] = SVM_Test(Data_Train_SVM, Labels_Train_SVM, filepath1_Test_Empty, numpackets, filepath2_Test_SIT, filepath3_Test_STAND, filepath4_Test_WALK )
%% TESTING
tic
Number_Empty_Files = length(filepath1_Test_Empty);% number of Experiment Files for Test
Data_Empty = [];
Labels_Test_SVM = {};

for i=1:Number_Empty_Files
filename = ['Train/Data8_Train/room/Red/EMPTY/' filepath1_Test_Empty{i}];
[csi_buff,NFFT] = CSIReader(filename,numpackets);
output = plotcsi(csi_buff, NFFT, false);
pcacomponents = PCAcomponents(output);
Data_Empty = [Data_Empty; FeatureExtraction(pcacomponents)];
Labels_Test_SVM{i} = {'Empty'};
end

k = i;

% for SIT test file

Number_Sit_Files = length(filepath2_Test_SIT);% number of Experiment Files for Test
Data_Sit = [];


for i=1:Number_Sit_Files
filename = ['Train/Data8_Train/room/Red/SIT/' filepath2_Test_SIT{i}];
[csi_buff,NFFT] = CSIReader(filename,numpackets);
output = plotcsi(csi_buff, NFFT, false);
pcacomponents = PCAcomponents(output);
Data_Sit = [Data_Sit; FeatureExtraction(pcacomponents)];
Labels_Test_SVM{i+k} = {'Sit'};
end

l = i+k;


% for STAND test file

Number_Stand_Files = length(filepath3_Test_STAND);% number of Experiment Files for train
Data_Stand = [];

for i=1:Number_Stand_Files
filename = ['Train/Data8_Train/room/Red/STAND/' filepath3_Test_STAND{i}];
[csi_buff,NFFT] = CSIReader(filename,numpackets);
output = plotcsi(csi_buff, NFFT, false);
pcacomponents = PCAcomponents(output);
Data_Stand = [Data_Stand; FeatureExtraction(pcacomponents)];
Labels_Test_SVM{i+l} = {'Stand'};
end

m = l+i;

% for Walk test file

Number_Walk_Files = length(filepath4_Test_WALK);% number of Experiment Files for train
Data_Walk = [];

for i=1:Number_Walk_Files
filename = ['Train/Data8_Train/room/Red/WALK/' filepath4_Test_WALK{i}];
[csi_buff,NFFT] = CSIReader(filename,numpackets);
output = plotcsi(csi_buff, NFFT, false);
pcacomponents = PCAcomponents(output);
Data_Walk = [Data_Walk; FeatureExtraction(pcacomponents)];
Labels_Test_SVM{i+m} = {'Walk'};
end


%% Final Test Data
% making the final Test Dataset of test data files features matrix
Data_Test_SVM = [Data_Empty; Data_Sit;Data_Stand;Data_Walk];
Labels_Test_SVM = string(Labels_Test_SVM)';
timeElapsed_TestData_prep_SVM = toc/60;
%% Predicting
tic
% Calling the SVM function for classification
[Prediction,Mdl1,Mdl2,Mdl3,Mdl4] = MultiSVM_Rd(Data_Train_SVM,Data_Test_SVM,Labels_Train_SVM);
 %%% 0 = NA ; 1 = EMPTY ; 2 = SIT  ; 3 = STAND ; 4 = WALK
Prediction_Labels = {};
for i = 1: length(Prediction)
    if Prediction(i) == 1
        Prediction_Labels{i} = 'Empty';
    elseif Prediction(i) == 2
        Prediction_Labels{i} = 'Sit';
    elseif Prediction(i) == 3
        Prediction_Labels{i} = 'Stand';
    elseif Prediction(i) == 4
        Prediction_Labels{i} = 'Walk';
    else Prediction_Labels{i} = 'NA';  % if none classified then assign Not applicable class
    end 
end

Prediction_Labels = string(Prediction_Labels)';


%% Confusion Chart
% computing the confusion matrix of predictions made by SVM

confusion_matrix_SVM = confusionmat(Labels_Test_SVM,Prediction_Labels);
% Visualizing the confusion matrix
SVM = confusionchart(Labels_Test_SVM,Prediction_Labels);
SVM.Title = 'SVM';
SVM.RowSummary = 'row-normalized';
SVM.ColumnSummary = 'column-normalized';
timeElapsed_AlgoExec_SVM = toc/60;
end