%% Feature extration for LSTM, SVM and NB from 2nd to 4th Moments
function [Data] = FeatureExtraction(PCAcomponents)
St = std(PCAcomponents);
MAD = mad(PCAcomponents);
medianValue = median(PCAcomponents);
meanValue = mean(PCAcomponents); 
momentSecond = moment(PCAcomponents,2); % gives Variance 
momentThird = moment(PCAcomponents,3); %  Skewness: measure the asymmetry of a distribution about its peak; it is a number that describes the shape of the distribution.
momentFourth = moment(PCAcomponents,4);  %  Kurtosis for measuring measures the peakness or flatness of a distribution % 
Data = [St(1,1), MAD(1,1), medianValue(1,1),meanValue(1,1),momentSecond(1,1),momentThird(1,1),momentFourth(1,1),St(1,2), MAD(1,2), medianValue(1,2),meanValue(1,2),momentSecond(1,2), momentThird(1,2),momentFourth(1,2)];
end

% % % %% Feature extration for LSTM, SVM and NB from 2nd to 4th Moments
% % % function [Data] = FeatureExtraction(PCAcomponents)
% % % St = std(PCAcomponents);
% % % MAD = mad(PCAcomponents);
% % % medianValue = median(PCAcomponents);
% % % kurtosisValue = kurtosis(PCAcomponents); 
% % % momentSecond = moment(PCAcomponents,2); % gives Variance 
% % % momentThird = moment(PCAcomponents,3); %  Skewness: measure the asymmetry of a distribution about its peak; it is a number that describes the shape of the distribution.
% % % momentFourth = moment(PCAcomponents,4);  %  Kurtosis for measuring measures the peakness or flatness of a distribution
% % % skewnessValue = skewness(PCAcomponents);
% % % % kurtosisValue = kurtosis(PCAcomponents);
% % % Data = [St(1,1), MAD(1,1), medianValue(1,1),kurtosisValue(1,1),momentSecond(1,1),momentThird(1,1),momentFourth(1,1),St(1,2), MAD(1,2), medianValue(1,2),kurtosisValue(1,2),momentSecond(1,2), momentThird(1,2),momentFourth(1,2)];
% % % end