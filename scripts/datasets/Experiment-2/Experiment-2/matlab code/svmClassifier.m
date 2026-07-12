% load ionosphere
% tbl = array2table(X);
% tbl.Y = Y;
% 
% rng('default') % For reproducibility of the data split
% partition = cvpartition(Y,'Holdout',0.15);
% idxTrain = training(partition); % Indices for the training set
% tblTrain = tbl(idxTrain,:);
% tblTest = tbl(~idxTrain,:);
% function result = svmClassifier()
statisticalFeatures = zeros(1,6);
teststatisticalFeatures = zeros(1,21);
    labels= strings(1,1);
    testlabels= strings(1,1);
Input_Data_Folder = './data/realdata/output_data/allsubs/30ms/'; % folder path to extract output data as .mat file

s=strcat(Input_Data_Folder,'*.mat'); %Access input data folder and bring .dat files
numOfTestSamples = 10;
    files = dir(s);
    sequences = cell(length(files), 1); % initialize the data array

    for i = 1:length(files)  %every files are iterated and their labels are extracted
        fName = files(i).name; % the name of the data file
        [filepath,label,ext] = fileparts(append(files(i).folder,"/",files(i).name));
        label = regexprep(label,'[\d"]','');
        if strcmp(label,'walk')
            labels(1,i) = 'walk';
%             labels(i) = {tempClassMatrix(:,:)};    
        elseif strcmp(label,'sit')
            labels(1,i) = 'sit or stand';
%             labels(i) = {tempClassMatrix(:,:)};
        elseif strcmp(label,'standup')
            labels(1,i) = 'standup';
        elseif strcmp(label,'stand')
            labels(1,i) = 'sit or stand';
%             labels(i) = {tempClassMatrix(:,:)};
%         elseif strcmp(label,'lie')
%             labels(i,1) = 'lie';
        elseif strcmp(label,'fall')
            labels(1,i) = 'fall';
        elseif strcmp(label,'sitdown')
            labels(1,i) = 'sitdown';

        end
        
        % add this trial to the data array
        s = strcat(Input_Data_Folder, fName);
        loaded = load(s);
        principalComponents = rmoutliers(loaded.output_matrix(:,1:10));
%                 figure
%         plot(denoise(rmoutliers(loaded.output_matrix(:,1:6))))
%         figure
% %         for l = 1:256
%         plot(denoise(rmoutliers(transpose(loaded.output_matrix(:,:)))));
%         hold on
%     end
%           rng default
% Fs = 1000;
% R = zeros(21,1);
% for l = 1:4
%     R(:,l) = autocorr(principalComponents(:,l));
% end       
%         N = length(R);
%         xdft = fft(R);  
%         xdft = xdft(1:N/2+1,:);
%         psdx = (1/(Fs*N)) * abs(xdft).^2;
%         psdx(2:end-1) = 2*psdx(2:end-1);
%         
%         if mod(size(principalComponents,1),2) == 1
%             data = principalComponents(1:size(principalComponents,1)-1, :);
%              freq = haart(data,5);
%         else
%              freq = haart(principalComponents,5);
%         end
       
        statisticalFeatures(i,:) = FeatureExtraction(principalComponents);
    end
    
    trainTable = array2table(statisticalFeatures);
    trainLabelTable = array2table(transpose(labels));
    T = [trainTable trainLabelTable];
    
    Test_Data_Folder = './data/realdata/output_data/allsubs/30ms/validation/'; % folder path to extract output data as .mat file
    s=strcat(Test_Data_Folder,'*.mat'); %Access input data folder and bring .dat files
    files = dir(s);
    t = templateSVM('Standardize',true,'KernelFunction','linear');
options = statset('UseParallel',true);
MyModel=fitcecoc((statisticalFeatures), transpose(labels),'Coding','onevsone', 'Learners',t,'ObservationsIn','rows','Verbose',2,'Options',options);
statisticalFeatures = zeros(1,6);    
    
    for j = 1:length(files)  %every files are iterated and their labels are extracted
        fName = files(j).name; % the name of the data file
        [filepath,testlabel,ext] = fileparts(append(files(j).folder,"/",files(j).name));
        testlabel = regexprep(testlabel,'[\d"]','');
        if strcmp(testlabel,'walk')
            testlabels(1,j) = 'walk';
%             labels(i) = {tempClassMatrix(:,:)};    
        elseif strcmp(testlabel,'sit')
            testlabels(1,j) = 'sit or stand';
%             labels(i) = {tempClassMatrix(:,:)};
        elseif strcmp(testlabel,'standup')
            testlabels(1,j) = 'standup';
        elseif strcmp(testlabel,'stand')
            testlabels(1,j) = 'sit or stand';
%             labels(i) = {tempClassMatrix(:,:)};
%         elseif strcmp(label,'lie')
%             labels(i,1) = 'lie';
        elseif strcmp(testlabel,'fall')
            testlabels(1,j) = 'fall';
        elseif strcmp(testlabel,'sitdown')
            testlabels(1,j) = 'sitdown';

        end
        
        
%         testlabels(1,j) = testlabel;
        % add this trial to the data array
        s = strcat(Test_Data_Folder, fName);
        loaded = load(s);
         principalComponents = rmoutliers(loaded.output_matrix(:,1:10));
%                  rng default
% Fs = 1000;
% R = zeros(21,1);
% for l = 1:4
%     R(:,l) = autocorr(principalComponents(:,l));
% end          
%           N = length(R);
%         xdft = fft(R);  
%         xdft = xdft(1:N/2+1,:);
%         psdx = (1/(Fs*N)) * abs(xdft).^2;
%         psdx(2:end-1) = 2*psdx(2:end-1);
%         
%         
%         if mod(size(principalComponents,1),2) == 1
%             data = principalComponents(1:size(principalComponents,1)-1, :);
%              freq = haart(data,5);
%         else
%              freq = haart(principalComponents,5);
%         end
         
        statisticalFeatures(j,:) = FeatureExtraction((principalComponents));
%         figure
%         plot(principalComponents)
    end
    

    testTable = array2table(statisticalFeatures);
    testLabelTable = array2table(transpose(testlabels));
    testT = [testTable testLabelTable];

    
outputlabels = predict(MyModel,(statisticalFeatures));
figure
plotconfusion(categorical(testlabels), categorical(transpose(outputlabels)));
% c2(1,:) = c2(1,:)/2 


% optLabels = trainedModelOptimized.predictFcn(testTable);
% figure
% optcm = confusionchart(categorical(testlabels),categorical(optLabels));
% %optcm(1,:) = optcm(1,:)/2
saveLearnerForCoder(MyModel, 'svmClass');
 result = MyModel
% end
