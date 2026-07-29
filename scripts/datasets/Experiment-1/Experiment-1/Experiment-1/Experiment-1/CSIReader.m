function [csi_buff,NFFT] = CSIReader(filepath,numpackets)
%% csireader.m
%
% read and plot CSI from UDPs created using the nexmon CSI extractor (nexmon.org/csi)
% modify the configuration section to your needs
% make sure you run >mex unpack_float.c before reading values from bcm4358 or bcm4366c0 for the first time
%
% the example.pcap file contains 4(core 0-1, nss 0-1) packets captured on a bcm4358
%

%% configuration
CHIP = '43455c0';       % wifi chip (possible values 4339, 4358, 43455c0, 4366c0)
BW = 40;                % bandwidth
path_01 = filepath;
FILE = path_01;% capture file
NPKTS_MAX = numpackets;       % max number of UDPs to process

%% read file
HOFFSET = 16;           % header offset
NFFT = BW*3.2;          % fft size4
p = readpcap();
p.open(FILE);
n = min(length(p.all()),NPKTS_MAX);
p.from_start();
csi_buff = complex(zeros(n,NFFT),0);
k = 1;
while (k <= n)
    f = p.next();
    if isempty(f)
        disp('no more frames');
        break;
    end
    if f.header.orig_len-(HOFFSET-1)*4 ~= NFFT*4
        disp('skipped frame with incorrect size');
        continue;
    end
    payload = f.payload;
   % print(payload)
    H = payload(HOFFSET:HOFFSET+NFFT-1);
    if (strcmp(CHIP,'4339') || strcmp(CHIP,'43455c0'))
        Hout = typecast(H, 'int16');
    elseif (strcmp(CHIP,'4358'))
        Hout = unpack_float(int32(0), int32(NFFT), H);
    elseif (strcmp(CHIP,'4366c0'))
        Hout = unpack_float(int32(1), int32(NFFT), H);
    else
        disp('invalid CHIP');
        break;
    end
    Hout = reshape(Hout,2,[]).';
    cmplx = double(Hout(1:NFFT,1))+1j*double(Hout(1:NFFT,2));
    csi_buff(k,:) = cmplx.';
    k = k + 1;
end

%% plot

% choice = input('Pilot and Null both removed as per #115 Enter 1 \n OR  Pilot and Unchanged carrier are removed Enter 2 OR without remooving any Subcarrier enter 3, Enter a number: ');
% switch choice
%     
% % PilotSubcarriers = [12 40 54 76 90 118] ie = 64 ( ±11, ±25, ±53 ) where x-axis ends with -(nfft/2) == -64 in file "plotcsi.m" x = -(nfft/2):1:(nfft/2-1); 
% 
% % NullSubcarriers = [1 2 3 4 5 6 64 65 66 124 125 126 127 128] ie = 64 ([-64, -63, -62, -61, -60, -59, -1, 0, 1, 59, 60, 61, 62, 63] ) where x-axis ends with -(nfft/2) == -64
% 
% % csi_buff - Unchanged_CSI_Columns = [1 2 62 63 64 65 66 67 68 128] % these coulms have constant unchanged value
% 
% %      80 MHz
% %      # nullsubcarriers  = np.array([x+128 for x in [-128, -127, -126, -125, -124, -123, -1, 0, 1, 123, 124, 125, 126, 127]])
% %      # pilotsubcarriers = np.array([x+128 for x in [-103, -75, -39, -11, 11, 39, 75, 103]])
% 
% 
% % Pilot and Null both removed as per #115
%     case 1
%         if BW == 20; 
%                 PilotNullsubcarriers = [ 1 2 3 4 5 6 12 40 54 64 65 66 76 90 118 124 125 126 127 128 ] %% Pilot and Null both removed as per #115
%                 csi_buff(:,PilotNullsubcarriers) = [] %% Remove the listed column of the list "PilotNullsubcarriers"
%                 NFFT = NFFT-numel(PilotNullsubcarriers)
%                 output = plotcsi(csi_buff, NFFT, false);
%         elseif BW == 40; 
%                 PilotNullsubcarriers = [ 1 2 3 4 5 6 12 40 54 64 65 66 76 90 118 124 125 126 127 128 ] %% Pilot and Null both removed as per #115
%                 csi_buff(:,PilotNullsubcarriers) = [] %% Remove the listed column of the list "PilotNullsubcarriers"
%                 NFFT = NFFT-numel(PilotNullsubcarriers)
%                 output = plotcsi(csi_buff, NFFT, false);
%         else BW == 80; 
%                 PilotNullsubcarriers = [ 1 2 3 4 5 6 12 40 54 64 65 66 76 90 118 124 125 126 127 128 ] %% Pilot and Null both removed as per #115
%                 csi_buff(:,PilotNullsubcarriers) = [] %% Remove the listed column of the list "PilotNullsubcarriers"
%                 NFFT = NFFT-numel(PilotNullsubcarriers)
%                 output = plotcsi(csi_buff, NFFT, false);
%             
%         end
%             
%     
%    
%  %   Pilot and Unchanged carrier are removed  " csi_buff - Unchanged_CSI_Columns" ##################
%     case 2
%     PilotUnchangedSubcarriers =  [ 1 2 12 40 54 62 63 64 65 66 67 68 76 90 118 128 ] %% Pilot and columnIndicesToDelete both removed
%     csi_buff(:,PilotUnchangedSubcarriers) = [] %% Remove the listed coloumn of the list "Pilotand UnchangedSubcarriers"
%     NFFT = NFFT-numel(PilotUnchangedSubcarriers)
%     output = plotcsi(csi_buff, NFFT, false);
%     
%  % without remooving the null and pilot subcarriers
%     case 3
%         
%     output = plotcsi(csi_buff, NFFT, false);
%   
%  % Null + Pilot + unchanged removed   
%     case 4
        
    PilotNullsubcarriers = [ 1 2 3 4 5 6 12 40 54 62 63 64 65 66 67 68 76 90 118 124 125 126 127 128 ]; %% Pilot and Null and unchanged  removed as per
%     PilotNullsubcarriers = [ 1 2 3 4 5 6 12 40 54 64 65 66 76 90 118 124 125 126 127 128 ]; %% Pilot and Null both removed as per #115
    csi_buff(:,PilotNullsubcarriers) = []; %% Remove the listed column of the list "PilotNullsubcarriers"
    NFFT = NFFT-numel(PilotNullsubcarriers);
    
    
    
%     otherwise
%     warning('Unexpected plot type. No plot created.')
end

%disp ( csi_buff)
% plotcsi(csi_buff, NFFT, false)

