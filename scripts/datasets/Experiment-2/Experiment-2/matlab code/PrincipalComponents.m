function [pc, time] = PrincipalComponents(denoisedMag, timeStamp)
 l = size(denoisedMag,1);
%      magxtime = [denoisedMag transpose(timeStamp)];
%      B = rmoutliers(magxtime);
     [coeff, pcaData,latend, tsd,varience] = pca(transpose(denoisedMag));
     principalComponents = pcaData;
%     fft(principalComponents,251);
%     figure 
%     plot(principalComponents)
    pc = principalComponents;
    time = timeStamp;
%  figure
%     subplot(2,1,1)
%     plot(pcaData(:,1:3))
%     title('3 Principal Components') 
%     
%     subplot(2,1,2)
%     plot(rmoutliers(pcaData(:,1:3)))
%     title('CSI with removed outliers') 

    
    
end