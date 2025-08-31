// dropdown.component.ts
import {
  Component,
  Input,
  forwardRef,
  ElementRef,
  HostListener,
  ViewChild,
  Output,
  EventEmitter,
  SimpleChanges,
  ChangeDetectionStrategy,
  viewChild,
  output,
  input,
  inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  FormControl,
  Validator,
  FormsModule,
  ValidationErrors,
} from '@angular/forms';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { LLMmodel } from '../../models/ai-response.interface';

@Component({
  selector: 'app-custom-dropdown',
  templateUrl: './custom-dropdown.component.html',
  styleUrl: './custom-dropdown.component.scss',
  imports: [TitleCasePipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDropdownComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CustomDropdownComponent),
      multi: true,
    },
    CommonModule,
    FormsModule,
  ],
  animations: [
    trigger('dropdownAnimation', [
      state(
        'hidden',
        style({
          height: '0',
          opacity: '0',
          overflow: 'hidden',
        })
      ),
      state(
        'visible',
        style({
          height: '*',
          opacity: '1',
        })
      ),
      transition('hidden => visible', [animate('200ms ease-in')]),
      transition('visible => hidden', [animate('200ms ease-out')]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomDropdownComponent
  implements ControlValueAccessor, Validator
{
  private elementRef = inject(ElementRef);
  options = input<LLMmodel[]>();
  labelField = input('name');
  valueField = input('model');
  iconField = input('icon');
  placeholder = input('Select an AI Model');
  width = input('250px');
  required = input(false);
  disabled = input(false);
  errorMessage = input('This field is required');
  selectedOption = input<LLMmodel>();

  selectionChange = output<any>();

  dropdownElement = viewChild.required<ElementRef>('dropdown');
  optionsContainerElement = viewChild.required<ElementRef>('optionsContainer');

  modelList: LLMmodel[] = [];
  modelSize = '';
  value = '';
  isOpen: boolean = false;
  touched: boolean = false;
  errorState: boolean = false;

  // Animation state
  dropdownState: 'visible' | 'hidden' = 'hidden';

  // Position variables
  openDirection: 'up' | 'down' = 'down';
  private windowHeight: number = 0;

  // Control Value Accessor Methods
  onChange: any = () => {};
  onTouched: any = () => {};

  constructor() {
    // Get window height on initialization
    this.windowHeight = window.innerHeight;

    // Listen for window resize to update windowHeight
    window.addEventListener('resize', () => {
      this.windowHeight = window.innerHeight;
      if (this.isOpen) {
        this.calculateDropdownPosition();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedOption']) {
      const option = this.selectedOption();
      if (option) {
        this.value = option.model!;
        this.modelSize = this.formatBytes(option.size!);
      }
    }
  }

  ngOnInit(): void {
    const first = this.options()?.[0];
    if (first) {
      this.value = first.model!;
      this.modelSize = this.formatBytes(first.size!);
    }
  }

  // Handle click outside
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);

    return `${value.toFixed(2)} ${sizes[i]}`;
  }

  // Toggle dropdown
  toggleDropdown(event: Event) {
    event.stopPropagation();

    if (this.disabled()) return;

    this.isOpen = !this.isOpen;
    this.dropdownState = this.isOpen ? 'visible' : 'hidden';
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }

    if (this.isOpen) {
      setTimeout(() => this.calculateDropdownPosition(), 0);
    }
  }

  // Calculate whether dropdown should open up or down
  calculateDropdownPosition() {
    if (!this.dropdownElement()) return;

    const dropdownRect =
      this.dropdownElement().nativeElement.getBoundingClientRect();
    const dropdownTop = dropdownRect.top;
    const dropdownBottom = dropdownRect.bottom;

    // Get the options container height (with a default if not yet rendered)
    let optionsHeight = 250; // Default max height
    if (this.optionsContainerElement) {
      const optionsContainer = this.optionsContainerElement().nativeElement;
      // Get the actual height or max-height of the options
      optionsHeight = Math.min(
        optionsContainer.scrollHeight,
        parseInt(getComputedStyle(optionsContainer).maxHeight) || optionsHeight
      );
    }

    // Space below = distance from dropdown bottom to window bottom
    const spaceBelow = this.windowHeight - dropdownBottom;
    // Space above = distance from dropdown top to window top
    const spaceAbove = dropdownTop;

    // Determine if dropdown should open upward
    if (spaceBelow < optionsHeight && spaceAbove > spaceBelow) {
      this.openDirection = 'up';
    } else {
      this.openDirection = 'down';
    }
  }

  // Close dropdown
  closeDropdown() {
    this.isOpen = false;
    this.dropdownState = 'hidden';
  }

  // Select option
  selectOption(option: any) {
    this.value = option[this.valueField()];
    this.onChange(this.value);
    this.onTouched();
    this.errorState = this.required() && this.value === null;
    this.selectionChange.emit(option);
    this.closeDropdown();
  }

  // Get display value
  getDisplayValue(): string {
    const selectedOption = this.options()?.find(
      (option) => option.model === this.value
    );
    return selectedOption ? selectedOption.model! : this.placeholder();
  }

  // Check if option is selected
  isSelected(option: any): boolean {
    return this.value === option[this.valueField()];
  }

  // ControlValueAccessor Interface Methods
  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  validate(control: FormControl): ValidationErrors | null {
    const isEmpty =
      control.value === null ||
      control.value === undefined ||
      control.value === '';

    if (this.required() && isEmpty) {
      this.errorState = true;
      return { required: true };
    }

    this.errorState = false;
    return null;
  }
}
