function main()
% networkName = 'RNN_LSTM_Network';
% trainDataPath = './data/realdata/output_data/allsubs/30ms/'; % train data path
% validationDataPath = './data/realdata/output_data/allsubs/30ms/validation/'; % validation data path
% testDataPath = './data/realdata/output_data/test/'; % test data path
% 
% % TRAINING DATA-SET
% % select all files that end in '.mat' from the directory
% [trainSequences, trainLabels] = createLSTMDataSet(trainDataPath);
% 
% % LSTM network is populated by train and validation data to train network
% % and validation data is required to prevent overfitting
% trainedNet = RNN_LSTM(trainSequences, trainLabels);
% Input_Data_Folder = './data/realdata/input_data/30ms/';
% % %prepare test data
% %     %testData = testData();
% %     % read training data
% % %     filename = './data/realdata/input_data/sitdown11.pcap';
% % %     [timeStamp, denoisedMagTraining] = fileReader(filename);
% % %     principalComponents = PrincipalComponents(denoisedMagTraining);
% % %     extractedFeautures = featureExtraction(principalComponents, timeStamp);
% % %     
% % % filename = './data/realdata/input_data/sitdown110.pcap';
% % % [timeStamp, denoisedMagTraining] = fileReader(filename);
% % % [principalComponents, time] = PrincipalComponents(denoisedMagTraining, timeStamp);
% % % figure
% % % plot(rmoutliers(principalComponents));
% % % figure
% % % plot(denoise(principalComponents))
% % 
% % %%prepare mu and sigma for pdf
% % 
% % % trainDataPath = './data/output_data/train/'; % train data path
% % % 
% % % [trainSequences, trainLabels] = createLSTMDataSet(trainDataPath);
% %     label_name = {'walk';'sit';'stand';'sitdown'};
% %     classNames = categorical(label_name);
% % %% create mu and sigma for each type of activity
%  load trainedNet
load lstmNetwork
load aftersitlstm
load afterwalklstm
load afterstanduplstm
% 
% trainedNet = RNN_LSTM_training();

% muSit = zeros(1,1);
% muStand = zeros(1,1);
% muSitdown = zeros(1,1);
% muStandUp = zeros(1,1);
% muWalk = zeros(1,1);
% muLie = zeros(1,1);
% muFall = zeros(1,1);
% numFeatures = 12;
% sigmaSit = zeros(1,1);
% sigmaStand = zeros(1,1);
% sigmaSitDown = zeros(1,1);
% sigmaStandUp = zeros(1,1);
% sigmaWalk = zeros(1,1);
% sigmaLie = zeros(1,1);
% sigmaFall = zeros(1,1);
% 
% sitMatrix = zeros(1,numFeatures);
% standMatrix = zeros(1,numFeatures);
% sitdownMatrix = zeros(1,numFeatures);
% standupMatrix = zeros(1,numFeatures);
% lieMatrix = zeros(1,numFeatures);
% fallMatrix = zeros(1,numFeatures);
% walkMatrix = zeros(1,numFeatures);
% 
% numFeatures = 12;
%  n1 = 0; n2 = 0; n3 = 0; n4 = 0; n5 = 0; n6 = 0; n7 = 0;
% % 
%  Input_Data_Folder="./data/realdata/input_data/30ms/"; % folder path to access input data
% s=strcat(Input_Data_Folder,'*.pcap'); %Access input data folder and bring .dat files
% data_files=dir(s);
% for i = 1:length(data_files)
%     
%     dataFilename=data_files(i).name; %extract filename of the each data file
%     filepath = strcat(Input_Data_Folder,'/',dataFilename); %create path for each data file using filename
%     [filename,name,ext] = fileparts(filepath); %extract filename and other information from its path for each data file
%     
%     name = regexprep(name,'[\d"]','');
%     %reading each activity data from its filepath using read_bf_file that
%     %is provided by used CSI Tool software
%     [tS, csiAmp] = fileReader(filepath);
% %     magxtime = [csiAmp transpose(tS)];
% %     B = rmoutliers(magxtime);
% %     figure
% %     plot(denoisedMag);
%     %subcarriers = denoisedMag(:,129:129+63);
% %     denoisedMag = B(:,1:234);
% %     subcarriers = denoisedMag;
% %     timeStamp=B(:,235);
% %         figure
% %         plot(subcarriers);
%         [principalComponents, time] = PrincipalComponents(transpose(csiAmp), tS);
% %         figure
% %         plot(principalComponents);
% 
% % [principalComponents, time] = PrincipalComponents(csiAmp, tS);
% magxtime = [principalComponents(:,1:6) transpose(time)];
% B = rmoutliers((magxtime));
% 
% denoisedB = denoise(B(:,1:6));
%     if(name == "walk")
%         n1 = n1 + 1;     
%         extractedFeautures = featureExtraction(denoisedB, B(:,7));
%         walkMatrix(n1,:) = reshape(extractedFeautures,[1,numFeatures]);
% %         figure
% %         plot(principalComponents);
%     end
% 
%     if(name == "fall")
%         n2 = n2 + 1;
%         
%         extractedFeautures = featureExtraction(denoisedB, B(:,7));
%         fallMatrix(n2,:) = reshape(extractedFeautures,[1,numFeatures]);
%     end
%     
%     if(name == "sit")
%         n3 = n3 + 1;
%         extractedFeautures = featureExtraction(denoisedB,B(:,7));
%         sitMatrix(n3,:) = reshape(extractedFeautures,[1,numFeatures]);
%         %break;
%     end
%     
%     if(name == "sitdown")
%         n4 = n4 + 1;
%         
%         extractedFeautures = featureExtraction(denoisedB,B(:,7));
%         sitdownMatrix(n4,:) = reshape(extractedFeautures,[1,numFeatures]);
% %                 figure
% %         plot(principalComponents);
% % 
% %         figure
% %         plot(principalComponents);
%     end
% %     
%     if(name == "stand")
%         n5 = n5 + 1;
%         extractedFeautures = featureExtraction(denoisedB, B(:,7));
%         standMatrix(n5,:) = reshape(extractedFeautures,[1,numFeatures]);
% %         figure
% %         plot(principalComponents);
%     end
% % %     
%     if(name == "standup")
%         n6 = n6 + 1;
%         extractedFeautures = featureExtraction(denoisedB, B(:,7));
%         standupMatrix(n6,:) = reshape(extractedFeautures,[1,numFeatures]);
%     end
% % %     
%     if(name == "lie")
%         n7 = n7 + 1;
%         [principalComponents, time] = PrincipalComponents(subcarriers, timeStamp);
%         extractedFeautures = featureExtraction(principalComponents, time);
%         lieMatrix(n7,:) = reshape(extractedFeautures,[1,numFeatures]);
%     end
% end
% % 
% writematrix(walkMatrix, "walkMatrix.txt");
% writematrix(sitMatrix, "sitMatrix.txt");
% writematrix(sitdownMatrix, "sitdownMatrix.txt");
% writematrix(standupMatrix, "standupMatrix.txt");
% writematrix(fallMatrix, "fallMatrix.txt");
% writematrix(standMatrix, "standMatrix.txt");

% % 
% % writematrix(walkMatrix, "walkMatrixData.txt");
% % writematrix(sitMatrix, "sitMatrixData.txt");
% % writematrix(sitdownMatrix, "sitdownMatrixData.txt");
% % writematrix(standMatrix, "standMatrixData.txt");
% 
% 
standMatrix = readmatrix("standMatrix.txt");
walkMatrix = readmatrix("walkMatrix.txt");
sitMatrix = readmatrix("sitMatrix.txt");
sitdownMatrix = readmatrix("sitdownMatrix.txt");
standupMatrix = readmatrix("standupMatrix.txt");
fallMatrix = readmatrix("fallMatrix.txt");
% standMatrix = normalize(standMatrix);
% walkMatrix = normalize(walkMatrix);
% sitMatrix = normalize(sitMatrix);
% sitdownMatrix = normalize(sitdownMatrix);
% % [mu,sigma]=normfit(sitMatrix);
% n1 = size(walkMatrix,1);
% % n2 = size(fallMatrix,1);
% n3 = size(sitMatrix,1);
% n4 = size(sitdownMatrix,1);
% n5 = size(standMatrix,1);
% % n6 = size(standupMatrix,1);
% % n7 = size(lieMatrix,1);
% 
muWalk = mean(walkMatrix(:,[3,9]));
muFall = mean(fallMatrix(:,[3,9]));
muSit = mean(sitMatrix(:,[3,9]));
muSitDown = mean(sitdownMatrix(:,[3,9]));
muStand = mean(standMatrix(:,[3,9]));
muStandUp = mean(standupMatrix(:,[3,9]));
% % muLie = sum(lieMatrix)/n7;
% % xxt = zeros(14,14);
% %xxt= zeros(n1,14);
% % for i = 1:n1
% %  xxt = xxt + transpose(walkMatrix(i,:))*walkMatrix(i,:);
% % end
% % xxt = xxt/n1;
% % sigma = xxt - transpose(muWalk)*muWalk+ 0.0001 *eye(size(muWalk,2));
% % inverseS= inv(sigma);

sigmaSit = cov(sitMatrix(:,[3,9]));
sigmaStand = cov(standMatrix(:,[3,9]));
sigmaSitDown = cov(sitdownMatrix(:,[3,9]));
sigmaStandUp = cov(standupMatrix(:,[3,9]));
sigmaWalk = cov(walkMatrix(:,[3,9]));
sigmaFall = cov(fallMatrix(:,[3,9]));

% sigmaWalk2 = zeros(numFeatures,numFeatures);
% sigmaWalk3 = zeros(numFeatures,numFeatures);
% for i = 1 : size(walkMatrix,1)
%     sigmaWalk2 = sigmaWalk2 + (transpose(walkMatrix(i,:)-muWalk)*(walkMatrix(i,:)-muWalk));
%     sigmaWalk3 = sigmaWalk3 + transpose(walkMatrix(i,:))*walkMatrix(i,:)-transpose(muWalk)*(muWalk);
% end
% sigmaWalk2 = sigmaWalk2 / size(walkMatrix,1);
% sigmaWalk3 = sigmaWalk3 / size(walkMatrix,1);
% % [sigma3,mu3] = robustcov(walkMatrix);
% % sigmaStandUp = cov(standupMatrix);
% %cov(walkMatrix) +0.0001 *eye(size(walkMatrix,2));
% e = eig(sigmaWalk)
% 
% % sigmaLie = cov(lieMatrix);
% % sigmaFall = cov(fallMatrix);
% % tf = issymmetric(sigmaSit);
% energyValues = [sitdownMatrix(:,1), sitdownMatrix(:,4),sitdownMatrix(:,7),sitdownMatrix(:,10)];
% sigmaEn = cov(energyValues)*(n4/(n4-1));
% eig(sigmaEn)
% muEn = mean(energyValues);

% %      [data, features] = readTrainingData();
    %% read test data
%      filename = './data/realdata/testdata/30ms/good/walkfall.pcap';
    filename3 = './data/realdata/input_data/30ms/csidata/validation/sitdown19.pcap';
    filename2 = './data/realdata/input_data/30ms/csidata/validation/walk37.pcap';
%     
    filename1 = './data/realdata/input_data/30ms/csidata/validation/standup125.pcap';
    filename0 = './data/realdata/input_data/30ms/csidata/validation/sit181.pcap';
%     filename3 = './data/realdata/input_data/30ms/csidata/validation/sitdown.pcap';
    [tStamp1, csiMag1] = fileReader(filename1);
    [tStamp2, csiMag2] = fileReader(filename2);
    [tStamp0, csiMag0] = fileReader(filename0);
    [tStamp3, csiMag3] = fileReader(filename3);
%     magxtime = [csiMag transpose(tStamp)];
%     cleaned = rmoutliers(magxtime);
    %denoisedMag = denoise(csiMag);
    lastTSof0 = tStamp0(1,size(tStamp0,2));
    lastTSof1 = tStamp1(1,size(tStamp1,2)) + lastTSof0;
    lastTSof2 = tStamp2(1,size(tStamp2,2)) + lastTSof1;
    csiMag = [transpose(csiMag0) transpose(csiMag1) transpose(csiMag2) transpose(csiMag3)];
    tStamp = [tStamp0 lastTSof0+tStamp1 lastTSof1+tStamp2 lastTSof2+tStamp3];
    denoisedAmp = (csiMag);
    timeCleaned = tStamp;
    
    [principalComponents, time] = PrincipalComponents((denoisedAmp), timeCleaned);
    y1 = denoisedAmp;

%     principalComponent = principalComponents;
%     figure
%     plot(principalComponent(:,1));
%     hold on
%     plot(principalComponent(:,2));
%     hold off
    
%     figure
%     plot(principalComponent(:,1) + principalComponent(:,2));
    %x = transpose(timeStamp);
    timeStamp = tStamp;
    %% pcolor plot
%         x = transpose(1:size(denoisedMag,1));
%     y = 1:256;
%     normA = denoisedMag - min(denoisedMag(:))
%     normA = normA ./ max(normA(:)) 
%     pcolor(x,y,transpose(normA))
%     shading interp;
%     colormap(jet(256))
%     colorbar;   
%%

nTimes = 1;
% for i = 1:size(principalComponents,1) 
%     if(timeStamp(1,i) > 10000)
%         lastIndex = i;
%         break
%     end
% end
%[principalComponents, time] = PrincipalComponents(denoisedMag, timeStamp);
% figure
% plot(principalComponents(:,1))stand6
% hold on
% 
% plot(principalComponents(:,2))
% hold off
lastIndex = 1;
previousLabel = "";
% [principalComponents, time] = PrincipalComponents((denoisedAmp), timeCleaned);
for i = 1:size(y1,2) 
    
%     if(timeStamp(1,i) > 10000)
    if(timeStamp(1,i)- timeStamp(1,lastIndex) > 3000 || i == size(y1,2)) %% take 3 seconds
        nTimes = nTimes + 1;
         
 %       subcarriers = denoisedMag(lastIndex:i,:);
        %subcarriers = normalize(subcarriers);

        extractedWindow = principalComponents(lastIndex:i,:);
        timeSt = transpose(timeStamp(:,lastIndex:i));
        window = [extractedWindow(:,1:10) timeSt];
        
        windowOutlier = rmoutliers(window(:,:));
        if(size(windowOutlier,1)<=15)
            break
        end
        windowdenoised = (windowOutlier(:,1:10));
        
        
        if previousLabel == "walk"|| previousLabel == "stand"
            mylstmNetwork = afterwalklstm
        elseif previousLabel == "sit"|| previousLabel == "sitdown"
            mylstmNetwork = aftersitlstm
        elseif previousLabel == "standup"
            mylstmNetwork = afterstanduplstm
        else
            mylstmNetwork = lstmNetwork
        end
        
        predLabels = classify(mylstmNetwork, (normalize(denoisedAmp(:,lastIndex:i))), 'MiniBatchSize', 10);
        
        
        if previousLabel == "walk" && predLabels == "standup"
            predLabels = "sitdown"
        elseif previousLabel == "sit" && predLabels == "sitdown"
            predLabels = "standup"
        end
        
        
        statisticalWindow = featureExtraction(windowdenoised, windowOutlier(:,11));
       
        % calculate pdf
        if predLabels == "walk"
            y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muWalk, sigmaWalk)
        elseif predLabels == "sit"
            y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muSit,sigmaSit)
        elseif predLabels == "stand"
            y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muStand,sigmaStand)
        elseif predLabels == "fall"
            y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muFall,sigmaFall)
        elseif predLabels == "sitdown" 
            y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muSitDown,sigmaSitDown)
        elseif predLabels == "standup"
            y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muStandUp,sigmaStandUp)
        end
        predLabels
        lastLabel = predLabels;
%         predLabel = classify(trainedNet, statisticalFeature, 'MiniBatchSize', 1)


%         predict(MyModel, statisticalFeature)
% 
%         figure
%         plot(denoise(rmoutliers(extractedWindow)));
%         lastIndex = i;
%         continue
%         
%         
%         extractedFeatures = featureExtraction(extractedWindow, transpose(timeSt));
%         extractedFeaturesReshaped = reshape(extractedFeatures,[1,numFeatures]);
%         sigma = cov(extractedFeaturesReshaped);
        

        %% energy
%         energySubwindowValue = [extractedFeaturesReshaped(:,1),extractedFeaturesReshaped(:,4),extractedFeaturesReshaped(:,7),extractedFeaturesReshaped(:,10)];
%         
% %         sigmaWalk = cov(walkMatrix)+0.0001 *eye(size(walkMatrix,2));
% %         sigmaSit = cov(sitMatrix)+0.0001 *eye(size(walkMatrix,2));
%         yWalkInitial = mvnpdf(extractedFeaturesReshaped,muWalk, sigmaWalk2);
%          ySit = mvnpdf(extractedFeaturesReshaped,muSit, sigmaSit);
%          ySitDown = mvnpdf(energySubwindowValue,muEn, sigmaEn);
%          
%          %%calculate pdf manually
%          X0 = energySubwindowValue - muEn;
%          sigmaInv = inv(sigmaEn);
%          detSigma = det(sigmaEn);
%          
%          manualPdf = exp(-0.5 * X0*sigmaInv*transpose(X0))/(((2*pi)^(2/2))*sqrt(detSigma));
%          
%          yStand = mvnpdf(extractedFeaturesReshaped,muStand, sigmaStand);
%         pcond(principalComponents(:,1), sitMatrixData)
%         yStand = mvnpdf(extractedFeatures,muStand,sigmaStand);
%         ySitDown = mvnpdf(extractedFeatures,muSitDown,sigmaSitDown);
%         yStandUp = mvnpdf(extractedFeatures,muStandUp,sigmaStandUp);
                
%         yFall = mvnpdf(extractedFeatures,muFall,sigmaFall);
%         yLie = mvnpdf(extractedFeatures,muLie,sigmaLie);
%maxPDF=max(ySit,yWalk, yStand,ySitDown);
   
        maxPDF = y;
        subwindowIndex = i;
        finalWindowIndex = i;
        previousIndex = i;
        sd = 0;
        su = 0;
        for j = i + 1:size(y1,2)
            if(timeStamp(1,j)- timeStamp(1,previousIndex)> 500 || j == size(y1,2))
                %extractedWindow = principalComponents(lastIndex:j,:);
                %extractedWindow = normalize(extractedWindow);
                %[principalComponentsSubWindow, timeSubWindow] = PrincipalComponents(extractedWindow, timeStamp(1, lastIndex:j));
                
                
                subextractedWindow = principalComponents(lastIndex:j,1:10);
                timeSt = transpose(timeStamp(:,lastIndex:j));
                window = [subextractedWindow timeSt];
        
                windowOutlier = rmoutliers(window(:,:));
                windowdenoised = (windowOutlier(:,1:10));
                predLabel = classify(mylstmNetwork, (normalize(denoisedAmp(:,lastIndex:j))));
        
                statisticalWindow = featureExtraction(windowdenoised, windowOutlier(:,11));
                if predLabel == "walk" && lastLabel == predLabel
                    y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muWalk,sigmaWalk)      
                elseif predLabel == "sit" && lastLabel == predLabel
                    y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muSit,sigmaSit)
                elseif predLabel == "stand" && lastLabel == predLabel
                    y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muStand,sigmaStand)
                elseif predLabel == "fall" && lastLabel == predLabel
                    y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muFall,sigmaFall)
                elseif predLabel == "sitdown" && lastLabel == predLabel && sd < 2
                    sd = sd + 1; 
                    y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muSitDown,sigmaSitDown)
                elseif predLabel == "standup" && lastLabel == predLabel && su < 2
                    su = su + 1;
                    y = mvnpdf(meshgrid(statisticalWindow(:,[3,9]),statisticalWindow(:,[3,9])),muStandUp,sigmaStandUp)
                else
                    lastIndex = previousIndex;
                    break
                end
                
                if y >= maxPDF
                    previousIndex = j;
                    if j == size(y1,2)
                       lastIndex = previousIndex; 
                       break
                    end
                    continue
                else
                    lastIndex = previousIndex;
                    break;
                end
%                 extractedFeaturestimeSubWindow = featureExtraction(extractedWindow, time(lastIndex:j,:));
%                 extractedFeaturesSubWindowReshaped = reshape(extractedFeaturestimeSubWindow,[1,numFeatures]);
%                 energySubSubwindowValue = [extractedFeaturesSubWindowReshaped(:,1),extractedFeaturesSubWindowReshaped(:,4),extractedFeaturesSubWindowReshaped(:,7),extractedFeaturesSubWindowReshaped(:,10)];
%         
%                 ySit = mvnpdf(extractedFeaturesSubWindowReshaped,muSit, sigmaSit);
%                 yWalk = mvnpdf(extractedFeaturesSubWindowReshaped,muWalk, sigmaWalk2);
%                 yStand = mvnpdf(extractedFeaturesSubWindowReshaped,muStand);
%                 ySitDown = mvnpdf(energySubSubwindowValue,muEn, sigmaEn);
% %                 yStandUp = mvnpdf(vpa(sym(extractedFeaturesSubWindowReshaped)),muStandUp,sigmaStandUp);
% %                 
% %                 yFall = mvnpdf(vpa(sym(extractedFeaturesSubWindowReshaped)),muFall,sigmaFall);
% %                 yLie = mvnpdf(vpa(sym(extractedFeaturesSubWindowReshaped)),muLie,sigmaLie);
% 
%                  maxPDFSubWindow = ySitDown;
%                 if(maxPDFSubWindow < maxPDF) %% if after adding 0.5 sec pdf value of a new window is less than previous window => stop adding 0.5 sec 
%                     finalWindowIndex = j;
%                     figure
%                     plot(extractedWindow)
%                    break;
%                 end
%                 if(maxPDFSubWindow >= maxPDF) %% if after adding 0.5 sec pdf value of a new window is more than previous window => add again 0.5 sec
%                     subwindowIndex = j;
%                     finalWindowIndex = j;
%                     maxPDF = maxPDFSubWindow;
%                 end
%                 figure
%                 plot(extractedWindow)
            end
        end
        
        %% call lstm for data from i to finalWindowIndex
        
        
%         lastIndex = finalWindowIndex;
        previousLabel = predLabels;
    end
%     end
end

   
    %%
%     x = size(denoisedMag,1);
%     figure
%     plot(B(:,257),principalComponents(:,1));
%     hold on
%     plot(B(:,257),principalComponents(:,2));
%     hold off
%     denoised = detrend(denoisedMag);
%     figure
%     Y = fft(denoised, x);
%     Pyy = Y.*conj(Y)/x;
% f = 1000/x*(0:x);
% plot(f,Pyy(1:x+1))
% title('Power spectral density')
% xlabel('Frequency (Hz)')
%
end