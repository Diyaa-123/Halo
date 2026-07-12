Input_Data_Folder = "./data/realdata/output_data/allsubs/30ms/"; % folder path to extract output data as .mat file
%Output_Data_Folder = "./data/realdata/output_data/allsubs/wooutliers/"; % folder path to extract output data as .mat file
s=strcat(Input_Data_Folder,'*.mat'); %Access input data folder and bring .dat files

    files = dir(s);
    sequences = cell(length(files), 1); % initialize the data array
    
     labels = strings(length(files), 1); % initialize the labels array
    tempClassMatrix= strings(1,1);
    for i = 1:length(files)  %every files are iterated and their labels are extracted
        fName = files(i).name; % the name of the data file
        
        % add this trial to the data array
        s = strcat(Input_Data_Folder, fName);
        loaded = load(s);
        denoised = transpose(loaded.output_matrix);
       % wooutliers = rmoutliers(denoised);
%         outFile=strcat(Output_Data_Folder,fName); %output file path is created with respect to previous filename of data.
%         save(outFile,'wooutliers');
%         nfft = length(denoised);
%         nfft2 = 2^nextpow2(nfft);
%         xfft = 1000*(0:nfft2/2-1)/nfft2;
% 
%         
%         figure
%         plot(denoised(:,1:4))
        
%         [pc, time] = PrincipalComponents(denoised, 1);
%         figure
%         plot(pc)
%           L = size(denoised,1);          
%             Y = fft(transpose(denoised),10);
% 
% 
% Pyy = Y.*conj(Y)/L;
% tmp = size((1:L/2+1),2);
% f = 1000/L*(1:L/2 +1);
% output = transpose(Pyy);
% figure
% plot(f,Pyy(10,1:tmp))
% title('Power spectral density')
% xlabel('Frequency (Hz)')
        
%       outFile=strcat(Output_Data_Folder,fName);  
%     save(outFile,'output');
    end