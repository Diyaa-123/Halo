%% This run the Algo MultiSVM with Random dividing the test and train data  set the percentage variable PD "Final File"
function [Prediction,Mdl1,Mdl2,Mdl3,Mdl4] = MultiSVM(Data_Train,Data_Test,Labels)
% finding the number of classed 
u=unique(Labels);
numClasses=length(u);
       % making a for loop for the number of classes
       for p=1:numClasses
            % assigning 1 to the first class and zero to all the other classes
            G1vAll=(Labels == u(p));
            % if its first class then make the first model for EMPTY
            if p == 1
                Mdl1 = fitcsvm(Data_Train, G1vAll,'Standardize',true,...
                       'KernelFunction','rbf');
            % if its the second class  then make the second model for SIT
            elseif p == 2
                Mdl2 = fitcsvm(Data_Train, G1vAll,'Standardize',true,...
                       'KernelFunction','rbf');
            % if its the third class then make the third model for STAND
            elseif p ==3
                Mdl3 = fitcsvm(Data_Train, G1vAll,'Standardize',true,...
                       'KernelFunction','rbf');
            % if its the fourth class then make the fourth model for WALK
            else
                Mdl4 = fitcsvm(Data_Train, G1vAll,'Standardize',true,...
                       'KernelFunction','rbf');
            end
       end
       
       
       for j=1:size(Data_Test)
            for p = 1:numClasses
               % making predictions for first class data one by one it takes first row and predicts its class then second then third and so on  
              if p == 1 && predict(Mdl1,Data_Test(j,:)) == 1
                  Prediction(j) = p;
               % making predictions for second class data one by one it takes first row and predicts its class then second then third and so on
              elseif p == 2 && predict(Mdl2,Data_Test(j,:)) == 1 
                  Prediction(j) = p;
               % making predictions for third class data one by one it takes first row and predicts its class then second then third and so on
              elseif p == 3 && predict(Mdl3,Data_Test(j,:)) == 1
                  Prediction(j) = p;
               % making predictions for fourth class data one by one it takes first row and predicts its class then second then third and so on
              elseif p == 4 && predict(Mdl4,Data_Test(j,:)) == 1
                  Prediction(j) = p;
              end
            end    
       end
end