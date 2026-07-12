function [pc,ft, time] = TrainingData(filename)
    [timeStamp, denoisedMagTraining] = fileReader(filename);
    [principalComponents, timeSt] = PrincipalComponents(denoisedMagTraining, timeStamp);
    extractedFeautures = featureExtraction(principalComponents, timeSt);
    pc = principalComponents;
    ft = extractedFeautures;
    time = timeSt;
end
