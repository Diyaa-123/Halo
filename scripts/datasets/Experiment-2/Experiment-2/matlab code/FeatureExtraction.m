function result =  FeatureExtraction(pcaComponents)
    St = std(pcaComponents);
    MAD = mad(pcaComponents);
    meanValue = mean(pcaComponents);
    medianValue = median(pcaComponents);
    kurtosisValue = kurtosis(pcaComponents);
    momentSecond = moment(pcaComponents,2);
    momentThird = moment(pcaComponents,3);
    skewnessValue = skewness(pcaComponents);
    interquar = iqr(pcaComponents);
    
%     meanpsd = mean(psdValues); %meanpsd(1,1),meanpsd(1,2), meanpsd(1,3)
%     maxpsd = max(psdValues); %maxpsd(1,1),maxpsd(1,2), maxpsd(1,3)
%     stdpsd= std(psdValues); %stdpsd(1,1),stdpsd(1,2), stdpsd(1,3)
%     iqrpsd = iqr(psdValues);%iqrpsd(1,1),iqrpsd(1,2), iqrpsd(1,3)
%     skewnesspsd = skewness(psdValues);%skewnesspsd(1,1),skewnesspsd(1,2), skewnesspsd(1,3)
%     kurtosispsd = kurtosis(psdValues);%kurtosispsd(1,1),kurtosispsd(1,2), kurtosispsd(1,3)
%     meanfreq = mean(freq);%meanfreq(1,1),meanfreq(1,2), meanfreq(1,3)
%     maxfreq = max(freq);%maxfreq(1,1),maxfreq(1,2), maxfreq(1,3)
%     stdfreq= std(freq);%stdfreq(1,1),stdfreq(1,2), stdfreq(1,3)
%     iqrfreq = iqr(freq);%iqrfreq(1,1),iqrfreq(1,2), iqrfreq(1,3)
result = [St(1,1),St(1,2),St(1,3),skewnessValue(1,1),skewnessValue(1,2),skewnessValue(1,3)];   
%      result = [St(1,1),St(1,2),St(1,3),MAD(1,1),MAD(1,2),MAD(1,3),kurtosisValue(1,1),kurtosisValue(1,2),kurtosisValue(1,3),momentSecond(1,1),momentSecond(1,2),momentSecond(1,3),momentThird(1,1),momentThird(1,2),momentThird(1,3),skewnessValue(1,1),skewnessValue(1,2),skewnessValue(1,3)];   
    %result = [St(1,1),MAD(1,1),meanValue(1,1),medianValue(1,1),kurtosisValue(1,1),momentSecond(1,1),skewnessValue(1,1),St(1,2),MAD(1,2),meanValue(1,2),medianValue(1,2),kurtosisValue(1,2),momentSecond(1,2),skewnessValue(1,2),St(1,3),MAD(1,3),meanValue(1,3),medianValue(1,3),kurtosisValue(1,3),momentSecond(1,3),skewnessValue(1,3), St(1,4),MAD(1,4),meanValue(1,4),medianValue(1,4),kurtosisValue(1,4),momentSecond(1,4),skewnessValue(1,4)];
end