filename = './data/realdata/testdata/testdata1.pcap';
svmClass = loadLearnerForCoder("svmClass.mat");
[tStamp, csiMag] = fileReader(filename);

[principalComponents, time] = PrincipalComponents(transpose(csiMag), tStamp);
lastIndex = 1;

for i = 1:size(principalComponents,1)    

    if(time(1,i)- time(1,lastIndex) > 2500 || i == size(principalComponents,1)) %% take 2 seconds
        denoised = denoise(principalComponents(lastIndex:i,:));
%             Output = step(LPF, denoised);
            for j = 1:size(denoised,1)
                if(abs(denoised(j,1))>4000)
                    denoised(j,1) = 0;
                end
                if(abs(denoised(j,2))>4000)
                    denoised(j,2) = 0;
                end    
            end
        features = FeatureExtraction(denoised);
        figure
        plot(denoised);
        predict(svmClass ,features)
        lastIndex = i;
    end

end
    